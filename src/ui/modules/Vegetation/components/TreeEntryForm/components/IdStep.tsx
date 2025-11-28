import React from 'react';
import { Search, ChevronRight, X } from 'lucide-react';
import { clsx } from 'clsx';
import type { StepProps } from '../types';

interface IdStepProps extends StepProps {
    tagNumber: string;
    setTagNumber: (val: string) => void;
    speciesName: string;
    setSpeciesName: (val: string) => void;
    speciesSearch: string;
    setSpeciesSearch: (val: string) => void;
    selectedSpeciesId: string | null;
    setSelectedSpeciesId: (val: string | null) => void;
    isUnknown: boolean;
    setIsUnknown: (val: boolean) => void;
    morphospeciesCode: string;
    setMorphospeciesCode: (val: string) => void;
    filteredSpecies: Array<{ id: string; scientificName: string; commonName: string }>;
    onCancel: () => void;
}

export const IdStep: React.FC<IdStepProps> = ({
    tagNumber,
    setTagNumber,
    speciesName,
    setSpeciesName,
    speciesSearch,
    setSpeciesSearch,
    setSelectedSpeciesId,
    isUnknown,
    setIsUnknown,
    morphospeciesCode,
    setMorphospeciesCode,
    filteredSpecies,
    onNext,
    onCancel
}) => {
    const isValid = tagNumber && ((!isUnknown && speciesName) || (isUnknown && morphospeciesCode));

    return (
        <div className="flex flex-col h-full">
            <div className="flex-1 space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div>
                    <label className="block text-xs font-medium text-text-muted uppercase mb-2">Tag Number</label>
                    <input
                        type="number"
                        value={tagNumber}
                        onChange={e => setTagNumber(e.target.value)}
                        className="w-full bg-panel-soft border border-border rounded-xl px-4 py-3 text-2xl font-mono text-text-main focus:border-primary outline-none transition-colors"
                        placeholder="101"
                        autoFocus
                    />
                </div>
                <div className="relative">
                    <label className="block text-xs font-medium text-text-muted uppercase mb-2">Species</label>
                    <div className="relative">
                        {isUnknown ? (
                            // Morphospecies input when unknown is selected
                            <div className="space-y-3">
                                <input
                                    type="text"
                                    value={morphospeciesCode}
                                    onChange={e => setMorphospeciesCode(e.target.value)}
                                    className="w-full bg-panel-soft border border-border rounded-xl px-4 py-3 text-lg text-text-main focus:border-primary outline-none transition-colors"
                                    placeholder="Morphospecies code (e.g. 'Unknown A')"
                                />
                                <div className="text-xs text-text-muted">Enter a morphospecies identifier for unknown specimens</div>
                            </div>
                        ) : (
                            // Standard species search when known
                            <>
                                <input
                                    type="text"
                                    value={speciesSearch}
                                    onChange={e => {
                                        setSpeciesSearch(e.target.value);
                                        setSpeciesName(e.target.value);
                                        setSelectedSpeciesId(null);
                                    }}
                                    className="w-full bg-panel-soft border border-border rounded-xl px-4 py-3 text-lg text-text-main focus:border-primary outline-none transition-colors"
                                    placeholder="Search species..."
                                    onFocus={() => setSpeciesSearch(speciesName)}
                                />
                                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-primary" />
                            </>
                        )}
                    </div>

                    {/* Species suggestions dropdown */}
                    {!isUnknown && speciesSearch && filteredSpecies.length > 0 && (
                        <div className="absolute z-10 mt-1 w-full bg-panel-soft border border-border rounded-xl max-h-60 overflow-y-auto shadow-lg">
                            {filteredSpecies.map((species) => (
                                <div
                                    key={species.id}
                                    className="px-4 py-3 hover:bg-border cursor-pointer border-b border-border last:border-b-0"
                                    onClick={() => {
                                        setSpeciesSearch(species.scientificName);
                                        setSpeciesName(species.scientificName);
                                        setSelectedSpeciesId(species.id);
                                    }}
                                >
                                    <div className="font-medium text-text-main">{species.scientificName}</div>
                                    <div className="text-xs text-text-muted">{species.commonName}</div>
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
                            className="w-4 h-4 rounded border-border bg-panel-soft text-primary focus:ring-primary"
                        />
                        <label htmlFor="unknown-species" className="text-sm text-text-muted">Unknown Species (Morphospecies)</label>
                    </div>
                </div>
            </div>

            {/* Footer Actions */}
            <div className="mt-auto pt-4 flex gap-3">
                <button
                    onClick={onCancel}
                    className="px-4 py-3 rounded-xl border border-border text-text-muted font-medium hover:bg-panel-soft transition"
                >
                    Cancel
                </button>
                <button
                    onClick={onNext}
                    disabled={!isValid}
                    className="flex-1 bg-primary text-app font-bold py-3 rounded-xl hover:bg-primary/90 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Next Step <ChevronRight className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
};
