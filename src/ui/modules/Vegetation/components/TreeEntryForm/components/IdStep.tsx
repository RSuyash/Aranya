import React, { useState } from 'react';
import { Search, Hash, Tag, ScanLine, AlertTriangle } from 'lucide-react';
import { clsx } from 'clsx';
import type { IdStepProps } from '../types';

export const IdStep: React.FC<IdStepProps> = ({
    tagNumber, setTagNumber,
    speciesName,
    setSpeciesName: _setSpeciesName,
    speciesSearch, setSpeciesSearch,
    selectedSpeciesId: _selectedSpeciesId,
    setSelectedSpeciesId: _setSelectedSpeciesId,
    isUnknown, setIsUnknown,
    morphospeciesCode, setMorphospeciesCode,
    filteredSpecies,
    onSelectSpecies,
    onNext: _onNext
}) => {
    const [isFocused, setIsFocused] = useState(false);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">

            {/* 1. TAG INPUT */}
            <div className="space-y-3">
                <label className="flex items-center gap-2 text-xs font-bold text-text-muted uppercase tracking-widest px-1">
                    <Hash size={14} className="text-primary" />
                    Tag Identification
                </label>
                <div className="relative group">
                    <div className="absolute inset-y-0 left-0 w-16 flex items-center justify-center text-text-muted border-r border-border group-focus-within:border-primary/50 group-focus-within:text-primary transition-colors">
                        <Tag size={24} />
                    </div>
                    <input
                        type="number"
                        value={tagNumber}
                        onChange={e => setTagNumber(e.target.value)}
                        className="w-full bg-panel-soft border-2 border-transparent ring-1 ring-border rounded-2xl pl-20 pr-6 py-6 text-4xl font-mono font-bold text-text-main focus:ring-primary focus:bg-panel outline-none transition-all shadow-sm focus:shadow-xl"
                        placeholder="000"
                        autoFocus
                    />
                    <div className="absolute right-6 top-1/2 -translate-y-1/2 text-text-muted/20">
                        <ScanLine size={32} />
                    </div>
                </div>
            </div>

            {/* 2. TAXONOMY SWITCHER */}
            <div className="bg-panel-soft p-1.5 rounded-2xl flex relative border border-border">
                <button
                    onClick={() => setIsUnknown(false)}
                    className={clsx(
                        "flex-1 py-3 text-xs font-bold uppercase tracking-wider rounded-xl transition-all duration-300 relative z-10",
                        !isUnknown ? "text-white bg-primary shadow-lg" : "text-text-muted hover:text-text-main"
                    )}
                >
                    Known Species
                </button>
                <button
                    onClick={() => {
                        setIsUnknown(true);
                        setSpeciesSearch('');
                    }}
                    className={clsx(
                        "flex-1 py-3 text-xs font-bold uppercase tracking-wider rounded-xl transition-all duration-300 relative z-10",
                        isUnknown ? "text-white bg-warning shadow-lg" : "text-text-muted hover:text-text-main"
                    )}
                >
                    Unknown
                </button>
            </div>

            {/* 3. DYNAMIC INPUT */}
            <div className="relative">
                {isUnknown ? (
                    <div className="space-y-3 animate-in fade-in zoom-in-95 duration-300">
                        <input
                            type="text"
                            value={morphospeciesCode}
                            onChange={e => setMorphospeciesCode(e.target.value)}
                            className="w-full bg-panel border-2 border-warning/30 rounded-2xl px-6 py-5 text-lg font-bold text-warning focus:border-warning focus:bg-warning/5 outline-none transition-all placeholder:text-warning/30"
                            placeholder="CODE (e.g. UNK-01)"
                        />
                        <div className="flex items-center gap-2 text-xs text-warning/80 pl-2">
                            <AlertTriangle size={12} />
                            <span className="font-bold">Temporary ID required</span>
                        </div>
                    </div>
                ) : (
                    <div className="relative animate-in fade-in zoom-in-95 duration-300 group">
                        <div className="absolute left-6 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-success transition-colors">
                            <Search size={24} />
                        </div>
                        <input
                            type="text"
                            value={speciesSearch}
                            onChange={e => {
                                setSpeciesSearch(e.target.value);
                                setIsFocused(true);
                            }}
                            onFocus={() => setIsFocused(true)}
                            // We don't blur immediately to allow clicking the dropdown
                            className="w-full bg-panel-soft border-2 border-transparent ring-1 ring-border rounded-2xl pl-16 pr-6 py-5 text-lg font-medium text-text-main focus:ring-success focus:bg-panel outline-none transition-all shadow-sm focus:shadow-lg placeholder:text-text-muted/50"
                            placeholder="Search scientific name..."
                        />

                        {/* Dropdown - Only show if searching and not exactly matched */}
                        {isFocused && speciesSearch && filteredSpecies.length > 0 && speciesSearch !== speciesName && (
                            <div className="absolute z-50 mt-2 w-full bg-panel border border-border rounded-2xl max-h-60 overflow-y-auto shadow-2xl custom-scrollbar animate-in slide-in-from-top-2">
                                {filteredSpecies.map((species) => (
                                    <button
                                        key={species.id}
                                        className="w-full text-left px-6 py-4 hover:bg-panel-soft border-b border-border last:border-0 group transition-colors"
                                        onClick={() => {
                                            onSelectSpecies(species.scientificName, species.id);
                                            setIsFocused(false); // Close dropdown
                                        }}
                                    >
                                        <div className="font-bold text-text-main group-hover:text-primary transition-colors text-base">
                                            {species.scientificName}
                                        </div>
                                        <div className="text-xs text-text-muted mt-0.5 font-medium">{species.commonName}</div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};