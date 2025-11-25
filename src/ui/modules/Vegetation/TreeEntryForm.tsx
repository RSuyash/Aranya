import React, { useState, useEffect, useMemo } from 'react';
import { X, ChevronRight, Save, Camera, Leaf, Plus, Trash2, Search } from 'lucide-react';
import { clsx } from 'clsx';
import { db } from '../../../core/data-model/dexie';
import { v4 as uuidv4 } from 'uuid';
import type { TreeObservation, VegetationModule } from '../../../core/data-model/types';
import { useLiveQuery } from 'dexie-react-hooks';

interface TreeEntryFormProps {
    projectId: string;
    moduleId: string;
    plotId: string;
    unitId: string;
    unitLabel: string;
    onClose: () => void;
    onSaveSuccess: () => void;
}

type Step = 'ID' | 'METRICS' | 'PHOTOS' | 'REVIEW';

export const TreeEntryForm: React.FC<TreeEntryFormProps> = ({
    projectId,
    moduleId,
    plotId,
    unitId,
    unitLabel,
    onClose,
    onSaveSuccess
}) => {
    const [currentStep, setCurrentStep] = useState<Step>('ID');

    // Form State
    const [tagNumber, setTagNumber] = useState('');
    const [speciesName, setSpeciesName] = useState('');
    const [speciesSearch, setSpeciesSearch] = useState(''); // For autocomplete search
    const [selectedSpeciesId, setSelectedSpeciesId] = useState<string | null>(null); // Store species list ID
    const [isUnknown, setIsUnknown] = useState(false);
    const [morphospeciesCode, setMorphospeciesCode] = useState(''); // For morphospecies tracking
    const [stems, setStems] = useState<Array<{ id: string; gbh: string }>>([
        { id: uuidv4(), gbh: '' }
    ]);
    const [height, setHeight] = useState('');
    const [hasBarkPhoto, setHasBarkPhoto] = useState(false);
    const [hasLeafPhoto, setHasLeafPhoto] = useState(false);

    // Fetch module data to get predefined species list and validation settings
    const moduleData = useLiveQuery(() => db.modules.get(moduleId)) as VegetationModule | undefined;

    // Filter species based on search term
    const filteredSpecies = useMemo(() => {
        if (!moduleData?.predefinedSpeciesList || !speciesSearch) return [];
        const term = speciesSearch.toLowerCase();
        return moduleData.predefinedSpeciesList
            .filter(s =>
                s.scientificName.toLowerCase().includes(term) ||
                s.commonName.toLowerCase().includes(term)
            )
            .slice(0, 10); // Performance optimization
    }, [moduleData, speciesSearch]);

    // Get validation thresholds from module settings (with defaults)
    const heightThreshold = moduleData?.validationSettings?.maxExpectedHeightM || 70; // Default to 70m if not specified
    const gbhThreshold = moduleData?.validationSettings?.maxExpectedGbhCm || 500; // Default to 500cm if not specified

    // Biometric validation - determine if values are within reasonable ranges
    const validationWarnings = useMemo(() => {
        const warnings: string[] = [];

        // Check GBH for each stem
        stems.forEach((s, i) => {
            const val = parseFloat(s.gbh);
            if (!isNaN(val)) {
                if (val < 1) {
                    warnings.push(`Stem ${i+1}: GBH ${val}cm is too small (likely <1cm).`);
                } else if (val > gbhThreshold) {
                    warnings.push(`Stem ${i+1}: GBH ${val}cm is unusually large (>${gbhThreshold}cm).`);
                }
            }
        });

        // Check height
        const h = parseFloat(height);
        if (!isNaN(h)) {
            if (h > heightThreshold) {
                warnings.push(`Height ${h}m is exceptionally tall (>${heightThreshold}m for this biome).`);
            } else if (h < 0.1 && h !== 0) {
                warnings.push(`Height ${h}m is unusually small (likely >0.1m).`);
            }
        }

        return warnings;
    }, [stems, height, heightThreshold, gbhThreshold]);

    // Determine if biometric data is flagged
    const hasBiometricWarnings = validationWarnings.length > 0;

    // Function to validate tag uniqueness within the plot
    const validateTagUniqueness = async (): Promise<boolean> => {
        if (!plotId || !tagNumber) return false;

        const existingTree = await db.treeObservations
            .where({ plotId, tagNumber: tagNumber.trim().toUpperCase() })
            .first();

        return !existingTree; // Returns true if tag is unique
    };

    // Calculate equivalent GBH using formula: GBH_eq = sqrt(sum(GBH_i^2))
    const equivalentGBH = useMemo(() => {
        const validStems = stems.filter(s => s.gbh && !isNaN(parseFloat(s.gbh)));
        if (validStems.length === 0) return 0;
        const sumOfSquares = validStems.reduce((sum, stem) => {
            const gbhValue = parseFloat(stem.gbh);
            return sum + (gbhValue * gbhValue);
        }, 0);
        return Math.sqrt(sumOfSquares);
    }, [stems]);

    // Auto-suggest next tag number
    useEffect(() => {
        const fetchLastTag = async () => {
            const lastTree = await db.treeObservations
                .where('plotId')
                .equals(plotId)
                .reverse()
                .sortBy('createdAt');

            if (lastTree && lastTree.length > 0) {
                const lastTag = parseInt(lastTree[0].tagNumber);
                if (!isNaN(lastTag)) {
                    setTagNumber((lastTag + 1).toString());
                }
            }
        };
        fetchLastTag();
    }, [plotId]);

    const handleSave = async (addAnother: boolean) => {
        // Validate tag uniqueness before saving
        const isTagUnique = await validateTagUniqueness();
        if (!isTagUnique) {
            alert(`Tag "${tagNumber.trim().toUpperCase()}" already exists in this plot. Please use a different tag number.`);
            return;
        }

        const now = Date.now();

        // Data Hygiene: Clean and validate inputs
        const cleanTag = tagNumber.trim().toUpperCase();
        // Clean species name based on whether it's unknown or morphospecies
        const cleanSpeciesName = isUnknown
            ? (morphospeciesCode || 'Unknown Specimen').trim()
            : speciesName.trim();
        const cleanHeight = height ? parseFloat(height) : undefined;

        // Build stems array with valid GBH values
        const validStems = stems
            .filter(s => s.gbh && !isNaN(parseFloat(s.gbh)))
            .map(s => ({
                id: s.id,
                gbh: parseFloat(s.gbh)
            }));

        // Determine validation status based on warnings
        const status = hasBiometricWarnings ? 'FLAGGED' : 'PENDING';
        const remarks = hasBiometricWarnings ? validationWarnings.join('; ') : undefined;

        const newTree: TreeObservation = {
            id: uuidv4(),
            projectId,
            moduleId,
            plotId,
            samplingUnitId: unitId,
            tagNumber: cleanTag,
            speciesListId: selectedSpeciesId, // Link to master species list
            speciesName: cleanSpeciesName,
            isUnknown,
            confidenceLevel: isUnknown ? 'LOW' : 'HIGH',
            gbh: equivalentGBH,
            height: cleanHeight,
            stems: validStems.length > 1 ? validStems : undefined,
            stemCount: validStems.length,
            condition: 'ALIVE',
            phenology: 'VEGETATIVE',
            images: [], // Placeholder for future image handling
            validationStatus: status, // Auto-flag if warnings exist
            remarks, // Store warnings for reviewer
            createdAt: now,
            updatedAt: now
        };

        await db.treeObservations.add(newTree);

        // Update Unit Status
        const existingProgress = await db.samplingUnits
            .where({ plotId, samplingUnitId: unitId })
            .first();

        if (!existingProgress) {
            await db.samplingUnits.add({
                id: uuidv4(),
                projectId,
                moduleId,
                plotId,
                samplingUnitId: unitId,
                status: 'IN_PROGRESS',
                createdAt: now,
                lastUpdatedAt: now
            });
        } else if (existingProgress.status === 'NOT_STARTED') {
            await db.samplingUnits.update(existingProgress.id, {
                status: 'IN_PROGRESS',
                lastUpdatedAt: now
            });
        }

        if (addAnother) {
            // Reset for next tree
            setTagNumber((prev) => (parseInt(prev) + 1).toString());
            setSpeciesName('');
            setSpeciesSearch('');
            setMorphospeciesCode(''); // Reset morphospecies code
            setSelectedSpeciesId(null);
            setStems([{ id: uuidv4(), gbh: '' }]);
            setHeight('');
            setHasBarkPhoto(false);
            setHasLeafPhoto(false);
            setCurrentStep('ID');
            onSaveSuccess(); // Trigger any parent refreshes if needed, but keep form open
        } else {
            onSaveSuccess();
            onClose();
        }
    };

    const renderStepIndicator = () => (
        <div className="flex items-center justify-center gap-2 mb-6">
            {(['ID', 'METRICS', 'PHOTOS', 'REVIEW'] as Step[]).map((step, idx) => (
                <div key={step} className="flex items-center">
                    <div className={clsx(
                        "w-2.5 h-2.5 rounded-full transition-all",
                        currentStep === step ? "bg-[#56ccf2] scale-125" :
                            idx < (['ID', 'METRICS', 'PHOTOS', 'REVIEW'].indexOf(currentStep)) ? "bg-[#52d273]" : "bg-[#1d2440]"
                    )} />
                    {idx < 3 && <div className="w-4 h-0.5 bg-[#1d2440] mx-1" />}
                </div>
            ))}
        </div>
    );

    return (
        <div className="fixed inset-0 z-50 bg-[#050814] flex flex-col animate-in slide-in-from-bottom duration-300">
            {/* Header */}
            <div className="px-4 py-4 border-b border-[#1d2440] flex items-center justify-between bg-[#0b1020]">
                <div className="flex items-center gap-3">
                    <button onClick={onClose} className="text-[#9ba2c0] hover:text-[#f5f7ff]">
                        <X className="w-6 h-6" />
                    </button>
                    <div>
                        <h2 className="text-lg font-bold text-[#f5f7ff]">New Tree</h2>
                        <p className="text-xs text-[#9ba2c0]">{unitLabel} • Plot {plotId.slice(0, 4)}...</p>
                    </div>
                </div>
                <div className="text-xs font-mono text-[#56ccf2] bg-[#071824] px-2 py-1 rounded border border-[#15324b]">
                    TAG: {tagNumber || '...'}
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
                {renderStepIndicator()}

                <div className="max-w-md mx-auto space-y-6">
                    {currentStep === 'ID' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div>
                                <label className="block text-xs font-medium text-[#9ba2c0] uppercase mb-2">Tag Number</label>
                                <input
                                    type="number"
                                    value={tagNumber}
                                    onChange={e => setTagNumber(e.target.value)}
                                    className="w-full bg-[#11182b] border border-[#1d2440] rounded-xl px-4 py-3 text-2xl font-mono text-[#f5f7ff] focus:border-[#56ccf2] outline-none"
                                    placeholder="101"
                                    autoFocus
                                />
                            </div>
                            <div className="relative">
                                <label className="block text-xs font-medium text-[#9ba2c0] uppercase mb-2">Species</label>
                                <div className="relative">
                                    {isUnknown ? (
                                        // Morphospecies input when unknown is selected
                                        <div className="space-y-3">
                                            <input
                                                type="text"
                                                value={morphospeciesCode}
                                                onChange={e => setMorphospeciesCode(e.target.value)}
                                                className="w-full bg-[#11182b] border border-[#1d2440] rounded-xl px-4 py-3 text-lg text-[#f5f7ff] focus:border-[#56ccf2] outline-none"
                                                placeholder="Morphospecies code (e.g. 'Unknown A')"
                                            />
                                            <div className="text-xs text-[#9ba2c0]">Enter a morphospecies identifier for unknown specimens</div>
                                        </div>
                                    ) : (
                                        // Standard species search when known
                                        <>
                                            <input
                                                type="text"
                                                value={speciesSearch}
                                                onChange={e => {
                                                    setSpeciesSearch(e.target.value);
                                                    setSpeciesName(e.target.value);  // Keep the name field updated
                                                    setSelectedSpeciesId(null);  // Reset selected species ID when typing
                                                }}
                                                className="w-full bg-[#11182b] border border-[#1d2440] rounded-xl px-4 py-3 text-lg text-[#f5f7ff] focus:border-[#56ccf2] outline-none"
                                                placeholder="Search species..."
                                                onFocus={() => setSpeciesSearch(speciesName)}
                                            />
                                            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#56ccf2]" />
                                        </>
                                    )}
                                </div>

                                {/* Species suggestions dropdown */}
                                {!isUnknown && speciesSearch && filteredSpecies.length > 0 && (
                                    <div className="absolute z-10 mt-1 w-full bg-[#11182b] border border-[#1d2440] rounded-xl max-h-60 overflow-y-auto shadow-lg">
                                        {filteredSpecies.map((species) => (
                                            <div
                                                key={species.id}
                                                className="px-4 py-3 hover:bg-[#1d2440] cursor-pointer border-b border-[#1d2440] last:border-b-0"
                                                onClick={() => {
                                                    setSpeciesSearch(species.scientificName);
                                                    setSpeciesName(species.scientificName);
                                                    setSelectedSpeciesId(species.id);
                                                }}
                                            >
                                                <div className="font-medium text-[#f5f7ff]">{species.scientificName}</div>
                                                <div className="text-xs text-[#9ba2c0]">{species.commonName}</div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Unknown species checkbox */}
                                <div className="mt-3 flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="unknown-species"
                                        checked={isUnknown}
                                        onChange={(e) => {
                                            const checked = e.target.checked;
                                            setIsUnknown(checked);
                                            if (checked) {
                                                setSpeciesSearch('');
                                                setSpeciesName('');
                                                setSelectedSpeciesId(null);
                                            } else {
                                                setMorphospeciesCode('');
                                            }
                                        }}
                                        className="w-4 h-4 rounded border-[#1d2440] bg-[#11182b] text-[#56ccf2]"
                                    />
                                    <label htmlFor="unknown-species" className="text-sm text-[#9ba2c0]">Unknown Species (Morphospecies)</label>
                                </div>
                            </div>
                        </div>
                    )}

                    {currentStep === 'METRICS' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <label className="text-xs font-medium text-[#9ba2c0] uppercase">Stem Measurements</label>
                                    <span className="text-xs font-mono text-[#56ccf2] bg-[#071824] px-2 py-1 rounded border border-[#15324b]">
                                        {stems.length} {stems.length === 1 ? 'stem' : 'stems'}
                                    </span>
                                </div>

                                <div className="space-y-3">
                                    {stems.map((stem, index) => {
                                        const val = parseFloat(stem.gbh);
                                        let borderClass = "border-[#1d2440]"; // default
                                        if (!isNaN(val)) {
                                            if (val < 1 || val > 500) {
                                                borderClass = "border-[#f2c94c]"; // warning color for extreme values
                                            }
                                        }

                                        return (
                                            <div key={stem.id} className="flex gap-2 items-center">
                                                <div className="flex-1 relative">
                                                    <label className="block text-xs text-[#9ba2c0] mb-1">
                                                        Stem {index + 1} GBH (cm)
                                                    </label>
                                                    <input
                                                        type="number"
                                                        value={stem.gbh}
                                                        onChange={e => {
                                                            const newStems = [...stems];
                                                            newStems[index].gbh = e.target.value;
                                                            setStems(newStems);
                                                        }}
                                                        className={`w-full bg-[#11182b] border ${borderClass} rounded-xl px-4 py-3 text-lg font-mono text-[#f5f7ff] focus:border-[#56ccf2] outline-none`}
                                                        placeholder="0"
                                                        autoFocus={index === 0}
                                                    />
                                                    {/* Warning indicator */}
                                                    {!isNaN(val) && (val < 1 || val > 500) && (
                                                        <div className="absolute -right-6 top-8 text-[#f2c94c] text-xs" title={`GBH ${val}cm is outside typical range`}>
                                                            ⚠️
                                                        </div>
                                                    )}
                                                </div>
                                                {stems.length > 1 && (
                                                    <button
                                                        onClick={() => setStems(stems.filter(s => s.id !== stem.id))}
                                                        className="mt-5 p-2 text-[#9ba2c0] hover:text-[#f5f7ff] hover:bg-[#1d2440] rounded-lg transition"
                                                        title="Remove stem"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>

                                <button
                                    onClick={() => setStems([...stems, { id: uuidv4(), gbh: '' }])}
                                    className="w-full mt-3 py-2.5 rounded-xl border-2 border-dashed border-[#1d2440] text-[#56ccf2] font-medium hover:border-[#56ccf2] hover:bg-[#071824] transition flex items-center justify-center gap-2"
                                >
                                    <Plus className="w-4 h-4" />
                                    Add Stem
                                </button>

                                {/* Equivalent GBH Display */}
                                {equivalentGBH > 0 && (
                                    <div className="mt-4 p-4 bg-[#071824] border border-[#15324b] rounded-xl">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-[#9ba2c0] uppercase">Equivalent GBH</span>
                                            <span className="text-2xl font-mono font-bold text-[#56ccf2]">
                                                {equivalentGBH.toFixed(2)} cm
                                            </span>
                                        </div>
                                        {stems.filter(s => s.gbh).length > 1 && (
                                            <div className="mt-2 text-xs text-[#555b75] font-mono">
                                                √({stems.filter(s => s.gbh).map(s => `${s.gbh}²`).join(' + ')})
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="relative">
                                <label className="block text-xs font-medium text-[#9ba2c0] uppercase mb-2">Height (m) <span className="text-[#555b75] lowercase">(optional)</span></label>
                                {(() => {
                                    const h = parseFloat(height);
                                    let borderClass = "border-[#1d2440]"; // default
                                    if (!isNaN(h)) {
                                        if (h > 70 || (h < 0.1 && h !== 0)) {
                                            borderClass = "border-[#f2c94c]"; // warning color
                                        }
                                    }
                                    return (
                                        <>
                                            <input
                                                type="number"
                                                value={height}
                                                onChange={e => setHeight(e.target.value)}
                                                className={`w-full bg-[#11182b] border ${borderClass} rounded-xl px-4 py-3 text-lg font-mono text-[#f5f7ff] focus:border-[#56ccf2] outline-none`}
                                                placeholder="0.0"
                                            />
                                            {/* Warning indicator */}
                                            {!isNaN(h) && (h > 70 || (h < 0.1 && h !== 0)) && (
                                                <div className="absolute -right-6 top-12 text-[#f2c94c] text-xs" title={`Height ${h}m is outside typical range`}>
                                                    ⚠️
                                                </div>
                                            )}
                                        </>
                                    );
                                })()}
                            </div>
                        </div>
                    )}

                    {currentStep === 'PHOTOS' && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                            <button
                                onClick={() => setHasBarkPhoto(!hasBarkPhoto)}
                                className={clsx(
                                    "w-full p-6 rounded-xl border-2 border-dashed flex flex-col items-center gap-3 transition",
                                    hasBarkPhoto ? "border-[#52d273] bg-[#0b2214]/30" : "border-[#1d2440] bg-[#11182b] hover:border-[#56ccf2]"
                                )}
                            >
                                <Camera className={clsx("w-8 h-8", hasBarkPhoto ? "text-[#52d273]" : "text-[#9ba2c0]")} />
                                <span className={clsx("font-medium", hasBarkPhoto ? "text-[#52d273]" : "text-[#9ba2c0]")}>
                                    {hasBarkPhoto ? "Bark Photo Added" : "Take Bark Photo"}
                                </span>
                            </button>

                            <button
                                onClick={() => setHasLeafPhoto(!hasLeafPhoto)}
                                className={clsx(
                                    "w-full p-6 rounded-xl border-2 border-dashed flex flex-col items-center gap-3 transition",
                                    hasLeafPhoto ? "border-[#52d273] bg-[#0b2214]/30" : "border-[#1d2440] bg-[#11182b] hover:border-[#56ccf2]"
                                )}
                            >
                                <Leaf className={clsx("w-8 h-8", hasLeafPhoto ? "text-[#52d273]" : "text-[#9ba2c0]")} />
                                <span className={clsx("font-medium", hasLeafPhoto ? "text-[#52d273]" : "text-[#9ba2c0]")}>
                                    {hasLeafPhoto ? "Leaf Photo Added" : "Take Leaf Photo"}
                                </span>
                            </button>
                        </div>
                    )}

                    {currentStep === 'REVIEW' && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="bg-[#11182b] border border-[#1d2440] rounded-xl p-4 space-y-3">
                                <div className="flex justify-between border-b border-[#1d2440] pb-2">
                                    <span className="text-[#9ba2c0]">Tag</span>
                                    <span className="font-mono font-bold text-[#f5f7ff]">{tagNumber}</span>
                                </div>
                                <div className="flex justify-between border-b border-[#1d2440] pb-2">
                                    <span className="text-[#9ba2c0]">Species</span>
                                    <span className="font-medium text-[#f5f7ff]">
                                        {isUnknown
                                            ? `${morphospeciesCode || 'Unknown Specimen'}`
                                            : speciesName}
                                    </span>
                                </div>

                                {/* Stem Details */}
                                {stems.filter(s => s.gbh).length > 1 ? (
                                    <>
                                        <div className="border-b border-[#1d2440] pb-2">
                                            <span className="text-[#9ba2c0] block mb-2">Stems ({stems.filter(s => s.gbh).length})</span>
                                            <div className="space-y-1">
                                                {stems.filter(s => s.gbh).map((stem, idx) => (
                                                    <div key={stem.id} className="text-sm font-mono text-[#f5f7ff] flex justify-between">
                                                        <span className="text-[#9ba2c0]">Stem {idx + 1}</span>
                                                        <span>{stem.gbh} cm</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="flex justify-between border-b border-[#1d2440] pb-2">
                                            <span className="text-[#9ba2c0]">Equivalent GBH</span>
                                            <span className="font-mono font-bold text-[#56ccf2]">{equivalentGBH.toFixed(2)} cm</span>
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex justify-between border-b border-[#1d2440] pb-2">
                                        <span className="text-[#9ba2c0]">GBH</span>
                                        <span className="font-mono text-[#f5f7ff]">{equivalentGBH.toFixed(2)} cm</span>
                                    </div>
                                )}

                                <div className="flex justify-between">
                                    <span className="text-[#9ba2c0]">Photos</span>
                                    <span className="text-[#f5f7ff]">{[hasBarkPhoto, hasLeafPhoto].filter(Boolean).length} added</span>
                                </div>

                                {/* Validation Warnings Display */}
                                {hasBiometricWarnings && (
                                    <div className="mt-4 p-3 bg-[#3a3a0a]/30 border border-[#f2c94c]/50 rounded-xl">
                                        <div className="flex items-start gap-2">
                                            <span className="text-[#f2c94c] mt-0.5">⚠️</span>
                                            <div>
                                                <div className="text-xs font-bold text-[#f2c94c] uppercase mb-1">Validation Warnings</div>
                                                <ul className="text-sm text-[#f5f7ff] space-y-1">
                                                    {validationWarnings.map((warning, idx) => (
                                                        <li key={idx} className="flex items-start">
                                                            <span className="text-[#f2c94c] mr-2">•</span>
                                                            {warning}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Footer Actions */}
            <div className="p-4 border-t border-[#1d2440] bg-[#0b1020] flex gap-3">
                {currentStep === 'ID' ? (
                    <>
                        <button
                            onClick={onClose}
                            className="px-4 py-3 rounded-xl border border-[#1d2440] text-[#9ba2c0] font-medium hover:bg-[#11182b] transition"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => {
                                if (!tagNumber) return;
                                // Check if species is valid (either selected from list, manually entered, or marked as unknown)
                                if (!isUnknown && !speciesName) return;
                                // If unknown, check if morphospecies code is provided
                                if (isUnknown && !morphospeciesCode) return;
                                setCurrentStep('METRICS');
                            }}
                            disabled={!tagNumber || (!isUnknown && !speciesName) || (isUnknown && !morphospeciesCode)}
                            className="flex-1 bg-[#56ccf2] text-[#050814] font-bold py-3 rounded-xl hover:bg-[#4ab8de] transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Next Step <ChevronRight className="w-5 h-5" />
                        </button>
                    </>
                ) : currentStep !== 'REVIEW' ? (
                    <>
                        <button
                            onClick={() => {
                                if (currentStep === 'METRICS') setCurrentStep('ID');
                                if (currentStep === 'PHOTOS') setCurrentStep('METRICS');
                            }}
                            className="px-4 py-3 rounded-xl border border-[#1d2440] text-[#9ba2c0] font-medium hover:bg-[#11182b] transition"
                        >
                            Back
                        </button>
                        <button
                            onClick={() => {
                                if (currentStep === 'METRICS') {
                                    // Validate at least one stem has a valid GBH value
                                    const hasValidStem = stems.some(s => s.gbh && !isNaN(parseFloat(s.gbh)));
                                    if (!hasValidStem) return;
                                    setCurrentStep('PHOTOS');
                                } else if (currentStep === 'PHOTOS') {
                                    setCurrentStep('REVIEW');
                                }
                            }}
                            className="flex-1 bg-[#56ccf2] text-[#050814] font-bold py-3 rounded-xl hover:bg-[#4ab8de] transition flex items-center justify-center gap-2"
                        >
                            Next Step <ChevronRight className="w-5 h-5" />
                        </button>
                    </>
                ) : (
                    <>
                        <button
                            onClick={() => setCurrentStep('PHOTOS')}
                            className="px-4 py-3 rounded-xl border border-[#1d2440] text-[#9ba2c0] font-medium hover:bg-[#11182b] transition"
                        >
                            Back
                        </button>
                        <div className="flex-1 flex gap-3">
                            <button
                                onClick={() => handleSave(true)}
                                className={`flex-1 ${hasBiometricWarnings ? 'bg-[#f2c94c] text-[#050814]' : 'bg-[#11182b] border border-[#56ccf2] text-[#56ccf2]'} font-bold py-3 rounded-xl hover:${hasBiometricWarnings ? 'bg-[#e0b743]' : 'bg-[#1d2440]'} transition`}
                            >
                                {hasBiometricWarnings ? 'Save Flagged & Add Another' : 'Save & Add Another'}
                            </button>
                            <button
                                onClick={() => handleSave(false)}
                                className={`flex-1 ${hasBiometricWarnings ? 'bg-[#f2c94c] text-[#050814]' : 'bg-[#52d273] text-[#050814]'} font-bold py-3 rounded-xl hover:${hasBiometricWarnings ? 'bg-[#e0b743]' : 'bg-[#45c165]'} transition flex items-center justify-center gap-2`}
                            >
                                <Save className="w-5 h-5" />
                                {hasBiometricWarnings ? 'Confirm & Finish' : 'Finish'}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};
