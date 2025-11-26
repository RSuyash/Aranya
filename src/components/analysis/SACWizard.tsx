import React, { useState, useMemo } from 'react';
import { X, Check, MagnifyingGlass, Funnel, ArrowRight, ChartBar } from 'phosphor-react';
import { clsx } from 'clsx';
import type { Plot } from '../../core/data-model/types';

interface SACWizardProps {
    plots: Plot[];
    onRun: (selectedPlotIds: string[]) => void;
    onClose: () => void;
}

export const SACWizard: React.FC<SACWizardProps> = ({ plots, onRun, onClose }) => {
    // Selection State
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(plots.map(p => p.id)));
    const [searchTerm, setSearchTerm] = useState('');

    // Filter Logic
    const filteredPlots = useMemo(() => {
        if (!searchTerm) return plots;
        const lower = searchTerm.toLowerCase();
        return plots.filter(p =>
            p.name.toLowerCase().includes(lower) ||
            p.code.toLowerCase().includes(lower) ||
            (p.habitatType || '').toLowerCase().includes(lower)
        );
    }, [plots, searchTerm]);

    // Handlers
    const togglePlot = (id: string) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setSelectedIds(newSet);
    };

    const toggleAllVisible = () => {
        const allVisibleSelected = filteredPlots.every(p => selectedIds.has(p.id));
        const newSet = new Set(selectedIds);

        if (allVisibleSelected) {
            // Deselect all visible
            filteredPlots.forEach(p => newSet.delete(p.id));
        } else {
            // Select all visible
            filteredPlots.forEach(p => newSet.add(p.id));
        }
        setSelectedIds(newSet);
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-[#0b1020] border border-[#1d2440] rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[85vh]">

                {/* Header */}
                <div className="px-6 py-5 border-b border-[#1d2440] bg-[#050814] rounded-t-2xl flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold text-[#f5f7ff] flex items-center gap-2">
                            <ChartBar className="w-6 h-6 text-[#f2c94c]" size={24} weight="duotone" />
                            SAC Configuration
                        </h2>
                        <p className="text-sm text-[#9ba2c0] mt-1">
                            Select plots to include in the Species Accumulation Curve.
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 text-[#9ba2c0] hover:text-white transition">
                        <X className="w-6 h-6" size={24} />
                    </button>
                </div>

                {/* Toolbar */}
                <div className="p-4 border-b border-[#1d2440] bg-[#11182b] flex gap-4 items-center">
                    <div className="relative flex-1">
                        <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#555b75]" size={16} />
                        <input
                            type="text"
                            placeholder="Filter by name, code, or habitat..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-[#050814] border border-[#1d2440] rounded-lg pl-10 pr-4 py-2 text-sm text-[#f5f7ff] focus:border-[#f2c94c] outline-none"
                        />
                    </div>
                    <button
                        onClick={toggleAllVisible}
                        className="px-3 py-2 text-xs font-medium text-[#9ba2c0] hover:text-[#f5f7ff] border border-[#1d2440] rounded-lg hover:bg-[#1d2440] transition"
                    >
                        {filteredPlots.every(p => selectedIds.has(p.id)) ? 'Deselect All' : 'Select All'}
                    </button>
                </div>

                {/* Plot List */}
                <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                    {filteredPlots.length === 0 ? (
                        <div className="text-center py-12 text-[#555b75]">
                            No plots match your search.
                        </div>
                    ) : (
                        filteredPlots.map(plot => {
                            const isSelected = selectedIds.has(plot.id);
                            return (
                                <div
                                    key={plot.id}
                                    onClick={() => togglePlot(plot.id)}
                                    className={clsx(
                                        "flex items-center gap-4 p-3 rounded-xl border transition-all cursor-pointer group",
                                        isSelected
                                            ? "bg-[#f2c94c]/10 border-[#f2c94c]/30"
                                            : "bg-transparent border-transparent hover:bg-[#1d2440] hover:border-[#1d2440]"
                                    )}
                                >
                                    {/* Checkbox UI */}
                                    <div className={clsx(
                                        "w-5 h-5 rounded border flex items-center justify-center transition-colors",
                                        isSelected
                                            ? "bg-[#f2c94c] border-[#f2c94c] text-[#050814]"
                                            : "border-[#555b75] group-hover:border-[#9ba2c0]"
                                    )}>
                                        {isSelected && <Check className="w-3.5 h-3.5" weight="bold" size={14} />}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-0.5">
                                            <span className={clsx(
                                                "font-mono text-sm font-bold",
                                                isSelected ? "text-[#f2c94c]" : "text-[#f5f7ff]"
                                            )}>
                                                {plot.code}
                                            </span>
                                            <span className="text-sm text-[#9ba2c0]">{plot.name}</span>
                                        </div>
                                        <div className="flex items-center gap-4 text-xs text-[#555b75]">
                                            <span className="flex items-center gap-1">
                                                <Funnel className="w-3 h-3" size={12} />
                                                {plot.habitatType || 'Unspecified Habitat'}
                                            </span>
                                            {/* You could add tree count here if available in the Plot object */}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-[#1d2440] bg-[#050814] rounded-b-2xl flex justify-between items-center">
                    <div className="text-sm text-[#9ba2c0]">
                        <span className="text-[#f5f7ff] font-bold">{selectedIds.size}</span> plots selected
                    </div>
                    <button
                        onClick={() => onRun(Array.from(selectedIds))}
                        disabled={selectedIds.size < 2}
                        className="flex items-center gap-2 px-6 py-2.5 bg-[#f2c94c] text-[#050814] rounded-xl font-bold hover:bg-[#e0b743] transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Generate Curve <ArrowRight className="w-5 h-5" size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
};
