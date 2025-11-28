import React from 'react';

interface VegetationMetricsStepProps {
    abundanceCount: string;
    setAbundanceCount: (val: string) => void;
    coverPercentage: string;
    setCoverPercentage: (val: string) => void;
    avgHeight: string;
    setAvgHeight: (val: string) => void;
}

export const VegetationMetricsStep: React.FC<VegetationMetricsStepProps> = ({
    abundanceCount,
    setAbundanceCount,
    coverPercentage,
    setCoverPercentage,
    avgHeight,
    setAvgHeight
}) => {
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
                <label className="block text-xs font-medium text-text-muted uppercase mb-2">
                    Individual Count <span className="text-text-muted/70 lowercase">(optional)</span>
                </label>
                <input
                    type="number"
                    value={abundanceCount}
                    onChange={e => setAbundanceCount(e.target.value)}
                    className="w-full bg-panel-soft border border-border rounded-xl px-4 py-3 text-2xl font-mono text-text-main focus:border-primary outline-none"
                    placeholder="0"
                    autoFocus
                    min="0"
                />
            </div>

            <div>
                <label className="block text-xs font-medium text-text-muted uppercase mb-2">
                    Ground Cover (%) <span className="text-text-muted/70 lowercase">(optional)</span>
                </label>
                <input
                    type="number"
                    value={coverPercentage}
                    onChange={e => {
                        const val = parseFloat(e.target.value);
                        if (e.target.value === '' || (val >= 0 && val <= 100)) {
                            setCoverPercentage(e.target.value);
                        }
                    }}
                    className="w-full bg-panel-soft border border-border rounded-xl px-4 py-3 text-2xl font-mono text-text-main focus:border-primary outline-none"
                    placeholder="0"
                    min="0"
                    max="100"
                    step="0.1"
                />
                {coverPercentage && parseFloat(coverPercentage) > 100 && (
                    <p className="mt-2 text-xs text-danger">Cover percentage must be between 0-100</p>
                )}
            </div>

            <div>
                <label className="block text-xs font-medium text-text-muted uppercase mb-2">
                    Avg Height (cm) <span className="text-text-muted/70 lowercase">(optional)</span>
                </label>
                <input
                    type="number"
                    value={avgHeight}
                    onChange={e => setAvgHeight(e.target.value)}
                    className="w-full bg-panel-soft border border-border rounded-xl px-4 py-3 text-lg font-mono text-text-main focus:border-primary outline-none"
                    placeholder="0.0"
                    min="0"
                    step="0.1"
                />
            </div>
        </div>
    );
};
