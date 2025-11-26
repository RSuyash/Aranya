import React, { useState, useEffect, useMemo } from 'react';
import { X, Save, Trash2, AlertTriangle } from 'lucide-react';
import { db } from '../../../core/data-model/dexie';
import { useLiveQuery } from 'dexie-react-hooks';
import type { VegetationModule } from '../../../core/data-model/types';
import { clsx } from 'clsx';
import { v4 as uuidv4 } from 'uuid';

interface TreeEditFormProps {
    treeId: string;
    onClose: () => void;
    onSaveSuccess: () => void;
}

export const TreeEditForm: React.FC<TreeEditFormProps> = ({
    treeId,
    onClose,
    onSaveSuccess
}) => {
    // Fetch tree data
    const tree = useLiveQuery(() => db.treeObservations.get(treeId), [treeId]);

    // Fetch module data for validation settings and species list
    const moduleData = useLiveQuery(
        () => tree ? db.modules.get(tree.moduleId) : undefined,
        [tree]
    ) as VegetationModule | undefined;

    // Form State
    const [tagNumber, setTagNumber] = useState('');
    const [speciesName, setSpeciesName] = useState('');
    const [speciesSearch, setSpeciesSearch] = useState('');
    const [selectedSpeciesId, setSelectedSpeciesId] = useState<string | null>(null);
    const [isUnknown, setIsUnknown] = useState(false);
    const [morphospeciesCode, setMorphospeciesCode] = useState('');
    const [stems, setStems] = useState<Array<{ id: string; gbh: string }>>([]);
    const [height, setHeight] = useState('');
    const [remarks, setRemarks] = useState('');
    const [isDirty, setIsDirty] = useState(false);

    // Initialize form when tree data loads
    useEffect(() => {
        if (tree) {
            setTagNumber(tree.tagNumber);
            setSpeciesName(tree.speciesName);
            setSpeciesSearch(tree.speciesName);
            setSelectedSpeciesId(tree.speciesListId || null);
            setIsUnknown(tree.isUnknown || false);
            // If unknown, the speciesName field holds the morphospecies code
            if (tree.isUnknown) {
                setMorphospeciesCode(tree.speciesName);
            }

            if (tree.stems && tree.stems.length > 0) {
                setStems(tree.stems.map(s => ({ id: s.id, gbh: s.gbh.toString() })));
            } else {
                // If no stems array but has GBH (legacy or single stem), create one stem
                setStems([{ id: uuidv4(), gbh: (tree.gbh || 0).toString() }]);
            }

            setHeight(tree.height ? tree.height.toString() : '');
            setRemarks(tree.remarks || '');
        }
    }, [tree]);

    // Filter species based on search term
    const filteredSpecies = useMemo(() => {
        if (!moduleData?.predefinedSpeciesList || !speciesSearch) return [];
        const term = speciesSearch.toLowerCase();
        return moduleData.predefinedSpeciesList
            .filter(s =>
                s.scientificName.toLowerCase().includes(term) ||
                s.commonName.toLowerCase().includes(term)
            )
            .slice(0, 10);
    }, [moduleData, speciesSearch]);

    // Validation thresholds
    const heightThreshold = moduleData?.validationSettings?.maxExpectedHeightM || 70;
    const gbhThreshold = moduleData?.validationSettings?.maxExpectedGbhCm || 500;

    // Biometric validation
    const validationWarnings = useMemo(() => {
        const warnings: string[] = [];
        stems.forEach((s, i) => {
            const val = parseFloat(s.gbh);
            if (!isNaN(val)) {
                if (val < 1) warnings.push(`Stem ${i + 1}: GBH ${val}cm is too small.`);
                else if (val > gbhThreshold) warnings.push(`Stem ${i + 1}: GBH ${val}cm is unusually large.`);
            }
        });
        const h = parseFloat(height);
        if (!isNaN(h)) {
            if (h > heightThreshold) warnings.push(`Height ${h}m is exceptionally tall.`);
            else if (h < 0.1 && h !== 0) warnings.push(`Height ${h}m is unusually small.`);
        }
        return warnings;
    }, [stems, height, heightThreshold, gbhThreshold]);

    const hasBiometricWarnings = validationWarnings.length > 0;

    // Calculate equivalent GBH
    const equivalentGBH = useMemo(() => {
        const validStems = stems.filter(s => s.gbh && !isNaN(parseFloat(s.gbh)));
        if (validStems.length === 0) return 0;
        const sumOfSquares = validStems.reduce((sum, stem) => {
            const gbhValue = parseFloat(stem.gbh);
            return sum + (gbhValue * gbhValue);
        }, 0);
        return Math.sqrt(sumOfSquares);
    }, [stems]);

    const handleSave = async () => {
        if (!tree) return;

        const now = Date.now();
        const cleanTag = tagNumber.trim().toUpperCase();
        const cleanSpeciesName = isUnknown
            ? (morphospeciesCode || 'Unknown Specimen').trim()
            : speciesName.trim();
        const cleanHeight = height ? parseFloat(height) : undefined;

        const validStems = stems
            .filter(s => s.gbh && !isNaN(parseFloat(s.gbh)))
            .map(s => ({
                id: s.id,
                gbh: parseFloat(s.gbh)
            }));

        const status = hasBiometricWarnings ? 'FLAGGED' : 'PENDING';
        const newRemarks = hasBiometricWarnings
            ? (remarks ? `${remarks}; ${validationWarnings.join('; ')}` : validationWarnings.join('; '))
            : remarks;

        await db.treeObservations.update(tree.id, {
            tagNumber: cleanTag,
            speciesListId: selectedSpeciesId || undefined,
            speciesName: cleanSpeciesName,
            isUnknown,
            confidenceLevel: isUnknown ? 'LOW' : 'HIGH',
            gbh: equivalentGBH,
            height: cleanHeight,
            stems: validStems.length > 1 ? validStems : undefined,
            stemCount: validStems.length,
            validationStatus: status,
            remarks: newRemarks,
            updatedAt: now
        });

        onSaveSuccess();
        onClose();
    };

    if (!tree) return null;

    return (
        <div className="fixed inset-0 z-[60] bg-[#050814]/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-[#0b1020] border border-[#1d2440] rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="px-6 py-4 border-b border-[#1d2440] flex items-center justify-between bg-[#050814] rounded-t-2xl">
                    <div>
                        <h2 className="text-lg font-bold text-[#f5f7ff]">Edit Tree</h2>
                        <div className="text-xs text-[#9ba2c0] font-mono">ID: {tree.id.slice(0, 8)}...</div>
                    </div>
                    <button onClick={onClose} className="text-[#9ba2c0] hover:text-[#f5f7ff] transition">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Tag & Species Row */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="col-span-1">
                            <label className="block text-xs font-medium text-[#9ba2c0] uppercase mb-2">Tag</label>
                            <input
                                type="text"
                                value={tagNumber}
                                onChange={e => { setTagNumber(e.target.value); setIsDirty(true); }}
                                className="w-full bg-[#11182b] border border-[#1d2440] rounded-xl px-3 py-2 text-lg font-mono text-[#f5f7ff] focus:border-[#56ccf2] outline-none"
                            />
                        </div>
                        <div className="col-span-2 relative">
                            <label className="block text-xs font-medium text-[#9ba2c0] uppercase mb-2">Species</label>
                            {isUnknown ? (
                                <input
                                    type="text"
                                    value={morphospeciesCode}
                                    onChange={e => { setMorphospeciesCode(e.target.value); setIsDirty(true); }}
                                    className="w-full bg-[#11182b] border border-[#1d2440] rounded-xl px-3 py-2 text-[#f5f7ff] focus:border-[#56ccf2] outline-none"
                                    placeholder="Morphospecies Code"
                                />
                            ) : (
                                <>
                                    <input
                                        type="text"
                                        value={speciesSearch}
                                        onChange={e => {
                                            setSpeciesSearch(e.target.value);
                                            setSpeciesName(e.target.value);
                                            setSelectedSpeciesId(null);
                                            setIsDirty(true);
                                        }}
                                        className="w-full bg-[#11182b] border border-[#1d2440] rounded-xl px-3 py-2 text-[#f5f7ff] focus:border-[#56ccf2] outline-none"
                                        placeholder="Search species..."
                                    />
                                    {speciesSearch && filteredSpecies.length > 0 && (
                                        <div className="absolute z-10 mt-1 w-full bg-[#161b22] border border-[#1d2440] rounded-xl max-h-40 overflow-y-auto shadow-lg">
                                            {filteredSpecies.map((species) => (
                                                <div
                                                    key={species.id}
                                                    className="px-3 py-2 hover:bg-[#1d2440] cursor-pointer text-sm"
                                                    onClick={() => {
                                                        setSpeciesSearch(species.scientificName);
                                                        setSpeciesName(species.scientificName);
                                                        setSelectedSpeciesId(species.id);
                                                        setIsDirty(true);
                                                    }}
                                                >
                                                    <div className="font-medium text-[#f5f7ff]">{species.scientificName}</div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </>
                            )}
                            <div className="mt-2 flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="edit-unknown"
                                    checked={isUnknown}
                                    onChange={(e) => { setIsUnknown(e.target.checked); setIsDirty(true); }}
                                    className="w-4 h-4 rounded border-[#1d2440] bg-[#11182b] text-[#56ccf2]"
                                />
                                <label htmlFor="edit-unknown" className="text-xs text-[#9ba2c0]">Unknown Species</label>
                            </div>
                        </div>
                    </div>

                    {/* Stems */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-xs font-medium text-[#9ba2c0] uppercase">Stems & GBH</label>
                            <button
                                onClick={() => { setStems([...stems, { id: uuidv4(), gbh: '' }]); setIsDirty(true); }}
                                className="text-xs text-[#56ccf2] hover:underline"
                            >
                                + Add Stem
                            </button>
                        </div>
                        <div className="space-y-2">
                            {stems.map((stem, index) => (
                                <div key={stem.id} className="flex gap-2 items-center">
                                    <span className="text-xs text-[#555b75] w-4">{index + 1}</span>
                                    <input
                                        type="number"
                                        value={stem.gbh}
                                        onChange={e => {
                                            const newStems = [...stems];
                                            newStems[index].gbh = e.target.value;
                                            setStems(newStems);
                                            setIsDirty(true);
                                        }}
                                        className="flex-1 bg-[#11182b] border border-[#1d2440] rounded-lg px-3 py-2 font-mono text-[#f5f7ff] focus:border-[#56ccf2] outline-none"
                                        placeholder="GBH (cm)"
                                    />
                                    {stems.length > 1 && (
                                        <button
                                            onClick={() => {
                                                setStems(stems.filter(s => s.id !== stem.id));
                                                setIsDirty(true);
                                            }}
                                            className="p-2 text-[#9ba2c0] hover:text-[#ff7e67]"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                        {equivalentGBH > 0 && (
                            <div className="mt-2 text-right text-xs text-[#52d273] font-mono">
                                Eq. GBH: {equivalentGBH.toFixed(2)} cm
                            </div>
                        )}
                    </div>

                    {/* Height & Remarks */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-[#9ba2c0] uppercase mb-2">Height (m)</label>
                            <input
                                type="number"
                                value={height}
                                onChange={e => { setHeight(e.target.value); setIsDirty(true); }}
                                className="w-full bg-[#11182b] border border-[#1d2440] rounded-xl px-3 py-2 font-mono text-[#f5f7ff] focus:border-[#56ccf2] outline-none"
                                placeholder="Optional"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-[#9ba2c0] uppercase mb-2">Remarks</label>
                            <input
                                type="text"
                                value={remarks}
                                onChange={e => { setRemarks(e.target.value); setIsDirty(true); }}
                                className="w-full bg-[#11182b] border border-[#1d2440] rounded-xl px-3 py-2 text-[#f5f7ff] focus:border-[#56ccf2] outline-none"
                                placeholder="Notes..."
                            />
                        </div>
                    </div>

                    {/* Validation Warnings */}
                    {hasBiometricWarnings && (
                        <div className="p-3 bg-[#3a3a0a]/30 border border-[#f2c94c]/50 rounded-xl flex gap-3">
                            <AlertTriangle className="w-5 h-5 text-[#f2c94c] flex-shrink-0" />
                            <div className="text-xs text-[#f5f7ff]">
                                <div className="font-bold text-[#f2c94c] mb-1">Validation Warnings</div>
                                <ul className="list-disc list-inside space-y-1">
                                    {validationWarnings.map((w, i) => <li key={i}>{w}</li>)}
                                </ul>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-[#1d2440] bg-[#0b1020] flex justify-end gap-3 rounded-b-2xl">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg text-[#9ba2c0] hover:text-[#f5f7ff] hover:bg-[#1d2440] transition"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!isDirty}
                        className={clsx(
                            "px-6 py-2 rounded-lg font-medium flex items-center gap-2 transition",
                            isDirty
                                ? "bg-[#52d273] text-[#050814] hover:bg-[#45c165]"
                                : "bg-[#1d2440] text-[#555b75] cursor-not-allowed"
                        )}
                    >
                        <Save className="w-4 h-4" />
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
};
