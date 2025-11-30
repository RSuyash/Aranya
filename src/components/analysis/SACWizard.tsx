import React, { useState, useMemo } from 'react';
import {
    X, Check, Search, Filter,
    ArrowRight, LineChart, Layers,
    CheckCircle2, Circle
} from 'lucide-react';
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

    const selectionCount = selectedIds.size;
    const canRun = selectionCount >= 2;

    return (
        // SURFACE: High-grade Glassmorphism overlay
        <div className="fixed inset-0 z-[100] bg-app/80 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-200">

            <div className="bg-panel border border-border rounded-3xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[85vh] transition-all duration-300 relative overflow-hidden">

                {/* Decorative gradients */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-blue-500 to-transparent" />
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

                {/* --- HEADER --- */}
                <div className="px-8 py-6 border-b border-border bg-panel/50 backdrop-blur-md relative z-10 flex justify-between items-start">
                    <div>
                        <div className="flex items-center gap-2 text-primary mb-1">
                            <LineChart size={18} />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Analytics Engine</span>
                        </div>
                        <h2 className="text-2xl font-black text-text-main tracking-tight">
                            Species Accumulation
                        </h2>
                        <p className="text-sm text-text-muted mt-2 max-w-sm">
                            Select sample units to generate the rarefaction curve. Minimum 2 plots required for variance calculation.
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full text-text-muted hover:text-text-main hover:bg-white/5 transition-all"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* --- TOOLBAR --- */}
                <div className="p-4 border-b border-border bg-panel-soft/30 flex gap-3 items-center">
                    <div className="relative flex-1 group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted group-focus-within:text-primary transition-colors" />
                        <input
                            type="text"
                            placeholder="Filter by code or habitat..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-panel border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-text-main focus:border-primary outline-none transition-all shadow-sm"
                        />
                    </div>
                    <button
                        onClick={toggleAllVisible}
                        className="px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-text-muted hover:text-text-main border border-border rounded-xl hover:bg-panel transition-all"
                    >
                        {filteredPlots.every(p => selectedIds.has(p.id)) ? 'Select None' : 'Select All'}
                    </button>
                </div>

                {/* --- DATASET SELECTION --- */}
                <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar bg-app/50">
                    {filteredPlots.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-text-muted border-2 border-dashed border-border rounded-2xl">
                            <Filter size={32} className="mb-3 opacity-20" />
                            <p className="text-sm">No plots matching criteria.</p>
                        </div>
                    ) : (
                        filteredPlots.map(plot => {
                            const isSelected = selectedIds.has(plot.id);
                            return (
                                <div
                                    key={plot.id}
                                    onClick={() => togglePlot(plot.id)}
                                    className={clsx(
                                        "flex items-center gap-4 p-4 rounded-xl border-2 transition-all cursor-pointer group relative overflow-hidden",
                                        isSelected
                                            ? "bg-panel border-primary/50 shadow-lg shadow-primary/5"
                                            : "bg-panel/30 border-transparent hover:border-border hover:bg-panel"
                                    )}
                                >
                                    {/* Selection State Indicator */}
                                    <div className={clsx(
                                        "w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300",
                                        isSelected
                                            ? "bg-primary text-app scale-110"
                                            : "bg-panel-soft border border-border text-transparent group-hover:border-text-muted"
                                    )}>
                                        <Check size={14} strokeWidth={4} />
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 z-10">
                                        <div className="flex items-center gap-3 mb-1">
                                            <span className={clsx(
                                                "font-mono text-sm font-bold px-1.5 rounded",
                                                isSelected ? "bg-primary/10 text-primary" : "bg-panel-soft text-text-muted"
                                            )}>
                                                {plot.code}
                                            </span>
                                            <span className={clsx(
                                                "text-sm font-medium transition-colors",
                                                isSelected ? "text-text-main" : "text-text-muted"
                                            )}>
                                                {plot.name}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-text-muted">
                                            <Layers size={12} />
                                            <span>{plot.habitatType || 'Unclassified Habitat'}</span>
                                        </div>
                                    </div>

                                    {/* Active "Glow" Bar on Right */}
                                    <div className={clsx(
                                        "absolute right-0 top-0 bottom-0 w-1 transition-all duration-300",
                                        isSelected ? "bg-primary" : "bg-transparent"
                                    )} />
                                </div>
                            );
                        })
                    )}
                </div>

                {/* --- FOOTER (Execute) --- */}
                <div className="p-6 border-t border-border bg-panel flex justify-between items-center relative z-20">
                    <div className="flex items-center gap-2">
                        {canRun ? (
                            <CheckCircle2 size={18} className="text-success" />
                        ) : (
                            <Circle size={18} className="text-text-muted opacity-50" />
                        )}
                        <div className="text-sm text-text-muted">
                            <span className={clsx("font-bold", canRun ? "text-text-main" : "text-text-muted")}>
                                {selectionCount}
                            </span> plots queued
                        </div>
                    </div>

                    <button
                        onClick={() => onRun(Array.from(selectedIds))}
                        disabled={!canRun}
                        className={clsx(
                            "flex items-center gap-3 px-8 py-3.5 rounded-xl font-bold text-sm transition-all shadow-lg active:scale-[0.98]",
                            canRun
                                ? "bg-primary text-app hover:bg-primary/90 shadow-primary/25"
                                : "bg-panel-soft border border-border text-text-muted cursor-not-allowed opacity-50"
                        )}
                    >
                        <span>Initialize Model</span>
                        <ArrowRight size={16} strokeWidth={3} />
                    </button>
                </div>
            </div>
        </div>
    );
};