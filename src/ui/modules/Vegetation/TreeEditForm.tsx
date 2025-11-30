import React, { useState, useEffect, useMemo } from 'react';
import { X, Save, Trash2 } from 'lucide-react';
import { db } from '../../../core/data-model/dexie';
import { useLiveQuery } from 'dexie-react-hooks';
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
    const tree = useLiveQuery(() => db.treeObservations.get(treeId), [treeId]);

    // [State Logic preserved...]
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

    useEffect(() => {
        if (tree) {
            setTagNumber(tree.tagNumber);
            setSpeciesName(tree.speciesName);
            setSpeciesSearch(tree.speciesName);
            setSelectedSpeciesId(tree.speciesListId || null);
            setIsUnknown(tree.isUnknown || false);
            if (tree.isUnknown) setMorphospeciesCode(tree.speciesName);

            if (tree.stems && tree.stems.length > 0) {
                setStems(tree.stems.map(s => ({ id: s.id, gbh: s.gbh.toString() })));
            } else {
                setStems([{ id: uuidv4(), gbh: (tree.gbh || 0).toString() }]);
            }
            setHeight(tree.height ? tree.height.toString() : '');
            setRemarks(tree.remarks || '');
        }
    }, [tree]);

    // [Calculation Logic preserved...]
    const equivalentGBH = useMemo(() => {
        const validStems = stems.filter(s => s.gbh && !isNaN(parseFloat(s.gbh)));
        if (validStems.length === 0) return 0;
        return Math.sqrt(validStems.reduce((sum, s) => sum + Math.pow(parseFloat(s.gbh), 2), 0));
    }, [stems]);

    const handleSave = async () => {
        if (!tree) return;
        // [Save Logic preserved...]
        const now = Date.now();
        const validStems = stems.filter(s => !isNaN(parseFloat(s.gbh))).map(s => ({ id: s.id, gbh: parseFloat(s.gbh) }));

        await db.treeObservations.update(tree.id, {
            tagNumber: tagNumber.trim().toUpperCase(),
            speciesListId: selectedSpeciesId || undefined,
            speciesName: isUnknown ? (morphospeciesCode || 'Unknown') : speciesName.trim(),
            isUnknown,
            gbh: equivalentGBH,
            height: height ? parseFloat(height) : undefined,
            stems: validStems.length > 1 ? validStems : undefined,
            stemCount: validStems.length,
            remarks,
            updatedAt: now,
            syncStatus: 'LOCAL_ONLY'
        });
        onSaveSuccess();
        onClose();
    };

    if (!tree) return null;

    return (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-panel border border-border rounded-3xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">

                {/* Header */}
                <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-panel-soft/50">
                    <div>
                        <h2 className="text-lg font-bold text-text-main">Data Correction</h2>
                        <div className="text-xs text-text-muted font-mono uppercase tracking-wider">ID: {tree.id.slice(0, 8)}</div>
                    </div>
                    <button onClick={onClose} className="text-text-muted hover:text-text-main transition bg-panel p-2 rounded-full border border-border hover:border-primary">
                        <X size={18} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-app/50">

                    {/* Tag & Species */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="col-span-1">
                            <label className="block text-xs font-bold text-text-muted uppercase mb-2">Tag</label>
                            <input
                                type="text"
                                value={tagNumber}
                                onChange={e => { setTagNumber(e.target.value); setIsDirty(true); }}
                                className="w-full bg-panel border border-border rounded-xl px-4 py-3 text-lg font-mono font-bold text-text-main focus:border-primary outline-none"
                            />
                        </div>
                        <div className="col-span-2 relative">
                            <label className="block text-xs font-bold text-text-muted uppercase mb-2">Species Identity</label>
                            {isUnknown ? (
                                <input
                                    type="text"
                                    value={morphospeciesCode}
                                    onChange={e => { setMorphospeciesCode(e.target.value); setIsDirty(true); }}
                                    className="w-full bg-panel border-2 border-warning/30 rounded-xl px-4 py-3 text-text-main focus:border-warning outline-none"
                                    placeholder="Morphospecies Code"
                                />
                            ) : (
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={speciesSearch}
                                        onChange={e => { setSpeciesSearch(e.target.value); setSpeciesName(e.target.value); setIsDirty(true); }}
                                        className="w-full bg-panel border border-border rounded-xl px-4 py-3 text-text-main focus:border-primary outline-none"
                                    />
                                    {/* Dropdown would go here similar to IdStep */}
                                </div>
                            )}
                            <label className="flex items-center gap-2 mt-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={isUnknown}
                                    onChange={e => { setIsUnknown(e.target.checked); setIsDirty(true); }}
                                    className="w-4 h-4 rounded border-border bg-panel text-warning"
                                />
                                <span className="text-xs text-text-muted font-medium">Mark as Unknown</span>
                            </label>
                        </div>
                    </div>

                    {/* Stems */}
                    <div className="bg-panel-soft/50 p-4 rounded-2xl border border-border">
                        <div className="flex items-center justify-between mb-3">
                            <label className="text-xs font-bold text-text-muted uppercase">Biometrics</label>
                            <button
                                onClick={() => { setStems([...stems, { id: uuidv4(), gbh: '' }]); setIsDirty(true); }}
                                className="text-xs font-bold text-primary hover:underline"
                            >
                                + Add Stem
                            </button>
                        </div>
                        <div className="space-y-2">
                            {stems.map((stem, index) => (
                                <div key={stem.id} className="flex gap-2 items-center">
                                    <span className="text-xs text-text-muted w-4 font-mono">{index + 1}</span>
                                    <input
                                        type="number"
                                        value={stem.gbh}
                                        onChange={e => {
                                            const newStems = [...stems];
                                            newStems[index].gbh = e.target.value;
                                            setStems(newStems);
                                            setIsDirty(true);
                                        }}
                                        className="flex-1 bg-panel border border-border rounded-lg px-3 py-2 font-mono text-text-main focus:border-primary outline-none"
                                        placeholder="GBH (cm)"
                                    />
                                    {stems.length > 1 && (
                                        <button
                                            onClick={() => { setStems(stems.filter(s => s.id !== stem.id)); setIsDirty(true); }}
                                            className="p-2 text-text-muted hover:text-danger transition-colors"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                        {equivalentGBH > 0 && (
                            <div className="mt-3 pt-3 border-t border-border flex justify-end">
                                <span className="text-xs font-mono text-success font-bold">Eq. GBH: {equivalentGBH.toFixed(2)} cm</span>
                            </div>
                        )}
                    </div>

                    {/* Meta */}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-text-muted uppercase mb-2">Height (m)</label>
                            <input
                                type="number"
                                value={height}
                                onChange={e => { setHeight(e.target.value); setIsDirty(true); }}
                                className="w-full bg-panel border border-border rounded-xl px-4 py-3 font-mono text-text-main focus:border-primary outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-text-muted uppercase mb-2">Remarks</label>
                            <textarea
                                value={remarks}
                                onChange={e => { setRemarks(e.target.value); setIsDirty(true); }}
                                className="w-full bg-panel border border-border rounded-xl px-4 py-3 text-text-main focus:border-primary outline-none resize-none h-24"
                            />
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-border bg-panel flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-6 py-3 rounded-xl font-bold text-text-muted hover:text-text-main hover:bg-panel-soft transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!isDirty}
                        className={clsx(
                            "px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg active:scale-95",
                            isDirty
                                ? "bg-primary text-white hover:bg-primary/90 shadow-primary/20"
                                : "bg-panel-soft text-text-muted cursor-not-allowed border border-border"
                        )}
                    >
                        <Save size={18} />
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
};