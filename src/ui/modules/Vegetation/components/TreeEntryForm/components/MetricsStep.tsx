import React from 'react';
import { Plus, Trash2, Ruler } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { clsx } from 'clsx';
import type { MetricsStepProps } from '../types';

export const MetricsStep: React.FC<MetricsStepProps> = ({
    stems, setStems, height, setHeight, equivalentGBH,
    onNext: _onNext
}) => {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
            {/* 1. STEMS LIST */}
            <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                    <label className="flex items-center gap-2 text-xs font-bold text-text-muted uppercase tracking-widest">
                        <Ruler size={14} className="text-primary" />
                        GBH Measurements
                    </label>
                    <div className="text-[10px] font-bold text-text-muted uppercase bg-panel-soft px-2 py-1 rounded border border-border">
                        Stem Count: {stems.length}
                    </div>
                </div>

                <div className="space-y-3">
                    {stems.map((stem, index) => {
                        const val = parseFloat(stem.gbh);
                        const isWarning = !isNaN(val) && (val < 1 || val > 500);

                        return (
                            <div key={stem.id} className="flex gap-3 items-center animate-in slide-in-from-bottom-2 duration-300">
                                <span className="text-xs font-bold text-text-muted w-6 text-center">{index + 1}</span>
                                <div className="flex-1 relative group">
                                    <input
                                        type="number"
                                        value={stem.gbh}
                                        onChange={e => {
                                            const newStems = [...stems];
                                            newStems[index].gbh = e.target.value;
                                            setStems(newStems);
                                        }}
                                        className={clsx(
                                            "w-full bg-panel-soft border-2 rounded-2xl px-6 py-4 text-2xl font-mono font-bold text-text-main focus:ring-0 outline-none transition-colors",
                                            isWarning ? "border-warning/50 bg-warning/5" : "border-transparent ring-1 ring-border focus:ring-primary focus:bg-panel"
                                        )}
                                        placeholder="0.0"
                                        autoFocus={index === stems.length - 1}
                                    />
                                    <span className="absolute right-6 top-1/2 -translate-y-1/2 text-xs font-bold text-text-muted">cm</span>
                                </div>

                                {stems.length > 1 && (
                                    <button
                                        onClick={() => setStems(stems.filter(s => s.id !== stem.id))}
                                        className="h-14 w-14 flex items-center justify-center rounded-2xl bg-panel-soft border border-border text-text-muted hover:text-danger hover:bg-danger/10 transition-colors"
                                    >
                                        <Trash2 size={20} />
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>

                <button
                    onClick={() => setStems([...stems, { id: uuidv4(), gbh: '' }])}
                    className="w-full py-4 rounded-2xl border-2 border-dashed border-border text-text-muted font-bold hover:border-primary hover:text-primary hover:bg-primary/5 transition-all flex items-center justify-center gap-2 text-sm bg-panel-soft/30"
                >
                    <Plus size={18} /> Add Stem
                </button>
            </div>

            {/* 2. METRICS DISPLAY */}
            <div className="grid grid-cols-2 gap-4">
                {equivalentGBH > 0 && (
                    <div className="bg-panel-soft border border-primary/20 rounded-2xl p-4 flex flex-col justify-center animate-in zoom-in-95 shadow-sm">
                        <div className="text-[10px] font-bold text-primary uppercase tracking-wider mb-1 opacity-80">Effective GBH</div>
                        <div className="text-2xl font-mono font-black text-text-main">
                            {equivalentGBH.toFixed(1)} <span className="text-sm text-text-muted">cm</span>
                        </div>
                    </div>
                )}

                {/* Height Input */}
                <div className="bg-panel-soft border border-border rounded-2xl p-1 flex flex-col justify-center relative group focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/50 transition-all shadow-sm">
                    <label className="absolute top-3 left-4 text-[10px] font-bold text-text-muted uppercase tracking-wider z-10">Height (m)</label>
                    <input
                        type="number"
                        value={height}
                        onChange={e => setHeight(e.target.value)}
                        className="w-full h-full bg-transparent px-4 pt-5 pb-1 text-2xl font-mono font-black text-text-main outline-none"
                        placeholder="--"
                    />
                </div>
            </div>
        </div>
    );
};