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
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(plots.map(p => p.id)));
    const [searchTerm, setSearchTerm] = useState('');

    const filteredPlots = useMemo(() => {
        if (!searchTerm) return plots;
        const lower = searchTerm.toLowerCase();
        return plots.filter(p =>
            p.name.toLowerCase().includes(lower) ||
            p.code.toLowerCase().includes(lower) ||
            (p.habitatType || '').toLowerCase().includes(lower)
        );
    }, [plots, searchTerm]);

    const togglePlot = (id: string) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedIds(newSet);
    };

    const toggleAllVisible = () => {
        const allVisibleSelected = filteredPlots.every(p => selectedIds.has(p.id));
        const newSet = new Set(selectedIds);
        filteredPlots.forEach(p => allVisibleSelected ? newSet.delete(p.id) : newSet.add(p.id));
        setSelectedIds(newSet);
    };

    return (
        // Overlay: Use black with opacity for focus
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
            {/* Modal: Use semantic colors (bg-panel, border-border) */}
            <div className="bg-panel border border-border rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[85vh] transition-colors duration-300">

                {/* Header */}
                <div className="px-6 py-5 border-b border-border bg-panel-soft/50 rounded-t-2xl flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold text-text-main flex items-center gap-2">
                            <ChartBar className="w-6 h-6 text-warning" size={24} weight="duotone" />
                            SAC Configuration
                        </h2>
                        <p className="text-sm text-text-muted mt-1">
                            Select plots to include in the Species Accumulation Curve.
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 text-text-muted hover:text-text-main transition">
                        <X className="w-6 h-6" size={24} />
                    </button>
                </div>

                {/* Toolbar */}
                <div className="p-4 border-b border-border bg-panel flex gap-4 items-center">
                    <div className="relative flex-1">
                        <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" size={16} />
                        {/* Input: Semantic Backgrounds */}
                        <input
                            type="text"
                            placeholder="Filter by name, code, or habitat..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-panel-soft border border-border rounded-lg pl-10 pr-4 py-2 text-sm text-text-main focus:border-primary outline-none transition-colors"
                        />
                    </div>
                    <button
                        onClick={toggleAllVisible}
                        className="px-3 py-2 text-xs font-medium text-text-muted hover:text-text-main border border-border rounded-lg hover:bg-panel-soft transition"
                    >
                        {filteredPlots.every(p => selectedIds.has(p.id)) ? 'Deselect All' : 'Select All'}
                    </button>
                </div>

                {/* Plot List */}
                <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                    {filteredPlots.length === 0 ? (
                        <div className="text-center py-12 text-text-muted">
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
                                            // Selected state uses Primary/Warning colors with opacity
                                            ? "bg-warning/10 border-warning/30"
                                            : "bg-transparent border-transparent hover:bg-panel-soft hover:border-border"
                                    )}
                                >
                                    <div className={clsx(
                                        "w-5 h-5 rounded border flex items-center justify-center transition-colors",
                                        isSelected
                                            ? "bg-warning border-warning text-app" // text-app creates contrast on the checkmark
                                            : "border-text-muted group-hover:border-text-muted/80"
                                    )}>
                                        {isSelected && <Check className="w-3.5 h-3.5" weight="bold" size={14} />}
                                    </div>

                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-0.5">
                                            <span className={clsx(
                                                "font-mono text-sm font-bold",
                                                isSelected ? "text-warning" : "text-text-main"
                                            )}>
                                                {plot.code}
                                            </span>
                                            <span className="text-sm text-text-muted">{plot.name}</span>
                                        </div>
                                        <div className="flex items-center gap-4 text-xs text-text-muted">
                                            <span className="flex items-center gap-1">
                                                <Funnel className="w-3 h-3" size={12} />
                                                {plot.habitatType || 'Unspecified Habitat'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-border bg-panel-soft/30 rounded-b-2xl flex justify-between items-center">
                    <div className="text-sm text-text-muted">
                        <span className="text-text-main font-bold">{selectedIds.size}</span> plots selected
                    </div>
                    <button
                        onClick={() => onRun(Array.from(selectedIds))}
                        disabled={selectedIds.size < 2}
                        className="flex items-center gap-2 px-6 py-2.5 bg-warning text-app rounded-xl font-bold hover:bg-warning/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Generate Curve <ArrowRight className="w-5 h-5" size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
};
