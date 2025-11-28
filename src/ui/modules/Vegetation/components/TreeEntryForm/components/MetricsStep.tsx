import React from 'react';
import { Plus, Trash2, ChevronRight } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import type { StepProps } from '../types';

interface MetricsStepProps extends StepProps {
    stems: Array<{ id: string; gbh: string }>;
    setStems: (stems: Array<{ id: string; gbh: string }>) => void;
    height: string;
    setHeight: (val: string) => void;
    equivalentGBH: number;
}

export const MetricsStep: React.FC<MetricsStepProps> = ({
    stems,
    setStems,
    height,
    setHeight,
    equivalentGBH,
    onNext,
    onBack
}) => {
    const hasValidStem = stems.some(s => s.gbh && !isNaN(parseFloat(s.gbh)));

    return (
        <div className="flex flex-col h-full">
            <div className="flex-1 space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <label className="text-xs font-medium text-text-muted uppercase">Stem Measurements</label>
                        <span className="text-xs font-mono text-primary bg-primary/10 px-2 py-1 rounded border border-primary/20">
                            {stems.length} {stems.length === 1 ? 'stem' : 'stems'}
                        </span>
                    </div>

                    <div className="space-y-3">
                        {stems.map((stem, index) => {
                            const val = parseFloat(stem.gbh);
                            let borderClass = "border-border"; // default
                            if (!isNaN(val)) {
                                if (val < 1 || val > 500) {
                                    borderClass = "border-warning"; // warning color for extreme values
                                }
                            }

                            return (
                                <div key={stem.id} className="flex gap-2 items-center">
                                    <div className="flex-1 relative">
                                        <label className="block text-xs text-text-muted mb-1">
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
                                            className={`w-full bg-panel-soft border ${borderClass} rounded-xl px-4 py-3 text-lg font-mono text-text-main focus:border-primary outline-none transition-colors`}
                                            placeholder="0"
                                            autoFocus={index === 0}
                                        />
                                        {/* Warning indicator */}
                                        {!isNaN(val) && (val < 1 || val > 500) && (
                                            <div className="absolute -right-6 top-8 text-warning text-xs" title={`GBH ${val}cm is outside typical range`}>
                                                ⚠️
                                            </div>
                                        )}
                                    </div>
                                    {stems.length > 1 && (
                                        <button
                                            onClick={() => setStems(stems.filter(s => s.id !== stem.id))}
                                            className="mt-5 p-2 text-text-muted hover:text-text-main hover:bg-panel-soft rounded-lg transition"
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
                        className="w-full mt-3 py-2.5 rounded-xl border-2 border-dashed border-border text-primary font-medium hover:border-primary hover:bg-primary/5 transition flex items-center justify-center gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        Add Stem
                    </button>

                    {/* Equivalent GBH Display */}
                    {equivalentGBH > 0 && (
                        <div className="mt-4 p-4 bg-app border border-border rounded-xl">
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-text-muted uppercase">Equivalent GBH</span>
                                <span className="text-2xl font-mono font-bold text-primary">
                                    {equivalentGBH.toFixed(2)} cm
                                </span>
                            </div>
                            {stems.filter(s => s.gbh).length > 1 && (
                                <div className="mt-2 text-xs text-text-muted font-mono">
                                    √({stems.filter(s => s.gbh).map(s => `${s.gbh}²`).join(' + ')})
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="relative">
                    <label className="block text-xs font-medium text-text-muted uppercase mb-2">Height (m) <span className="text-text-muted/70 lowercase">(optional)</span></label>
                    {(() => {
                        const h = parseFloat(height);
                        let borderClass = "border-border"; // default
                        if (!isNaN(h)) {
                            if (h > 70 || (h < 0.1 && h !== 0)) {
                                borderClass = "border-warning"; // warning color
                            }
                        }
                        return (
                            <>
                                <input
                                    type="number"
                                    value={height}
                                    onChange={e => setHeight(e.target.value)}
                                    className={`w-full bg-panel-soft border ${borderClass} rounded-xl px-4 py-3 text-lg font-mono text-text-main focus:border-primary outline-none transition-colors`}
                                    placeholder="0.0"
                                />
                                {/* Warning indicator */}
                                {!isNaN(h) && (h > 70 || (h < 0.1 && h !== 0)) && (
                                    <div className="absolute -right-6 top-12 text-warning text-xs" title={`Height ${h}m is outside typical range`}>
                                        ⚠️
                                    </div>
                                )}
                            </>
                        );
                    })()}
                </div>
            </div>

            {/* Footer Actions */}
            <div className="mt-auto pt-4 flex gap-3">
                <button
                    onClick={onBack}
                    className="px-4 py-3 rounded-xl border border-border text-text-muted font-medium hover:bg-panel-soft transition"
                >
                    Back
                </button>
                <button
                    onClick={onNext}
                    disabled={!hasValidStem}
                    className="flex-1 bg-primary text-app font-bold py-3 rounded-xl hover:bg-primary/90 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Next Step <ChevronRight className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
};
