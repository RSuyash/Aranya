import React from 'react';
import type { SACPoint } from '../../analysis/sac';

export interface SACChartProps {
    data: SACPoint[];
    mode?: 'cumulative' | 'random';
    showGrid?: boolean;
    showTooltips?: boolean;
    height?: number;
    className?: string;
}

export const SpeciesAreaCurveChart: React.FC<SACChartProps> = ({
    data,
    mode = 'random',
    showGrid = true,
    showTooltips = true,
    height = 256,
    className = '',
}) => {
    if (!data || data.length === 0) {
        return (
            <div className={`flex items-center justify-center text-text-muted italic ${className}`} style={{ height }}>
                No data available
            </div>
        );
    }

    const maxRichness = data[data.length - 1]?.richness || 1;
    const maxPlots = data.length;

    // Generate Y-axis labels (species richness)
    const yAxisSteps = 5;
    const yAxisLabels = Array.from({ length: yAxisSteps + 1 }, (_, i) => {
        return Math.round((maxRichness / yAxisSteps) * i);
    }).reverse();

    return (
        <div className={`relative ${className}`}>
            {/* Chart Container */}
            <div className="flex gap-4">
                {/* Y-Axis Labels */}
                <div className="flex flex-col justify-between text-xs text-text-muted py-2" style={{ height }}>
                    {yAxisLabels.map((label, idx) => (
                        <div key={idx} className="text-right pr-2 leading-none">
                            {label}
                        </div>
                    ))}
                </div>

                {/* Chart Area */}
                <div className="flex-1 relative">
                    {/* Grid Lines */}
                    {showGrid && (
                        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                            {yAxisLabels.map((_, idx) => (
                                <div key={idx} className="border-t border-[#1d2440]/50" />
                            ))}
                        </div>
                    )}

                    {/* Bars Container */}
                    <div
                        className="relative flex items-end gap-2 px-2 pb-2 border-b border-l border-[#1d2440]"
                        style={{ height }}
                    >
                        {data.map((point: SACPoint, idx: number) => {
                            const heightPct = (point.richness / maxRichness) * 100;

                            return (
                                <div
                                    key={idx}
                                    className="flex-1 flex flex-col justify-end group relative min-w-[40px]"
                                >
                                    {/* Bar */}
                                    <div
                                        className="w-full bg-gradient-to-t from-[#56ccf2]/60 to-[#56ccf2]/40 border-t-4 border-[#56ccf2] rounded-t-sm hover:from-[#56ccf2]/80 hover:to-[#56ccf2]/60 transition-all duration-300"
                                        style={{ height: `${heightPct}%`, minHeight: '8px' }}
                                    />

                                    {/* Tooltip */}
                                    {showTooltips && (
                                        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-[#0b1020] border border-[#56ccf2]/30 px-3 py-2 text-xs rounded-md text-white opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-10 shadow-lg transition-opacity duration-200">
                                            <div className="font-semibold text-[#56ccf2] mb-1">
                                                Step {idx + 1}
                                            </div>
                                            <div className="flex flex-col gap-0.5">
                                                <div>Plots: {point.plotsSampled}</div>
                                                <div>Species: {point.richness}</div>
                                            </div>
                                            {/* Tooltip Arrow */}
                                            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
                                                <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-[#56ccf2]/30" />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* X-Axis Labels */}
                    <div className="flex justify-between text-xs text-text-muted mt-2 px-2">
                        <span>1 Plot</span>
                        <span className="text-center flex-1">
                            {mode === 'cumulative' ? 'Cumulative Area' : 'Plots Sampled'} →
                        </span>
                        <span>{maxPlots} Plots</span>
                    </div>
                </div>
            </div>

            {/* Y-Axis Label (Vertical) */}
            <div
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-6 text-xs text-text-muted uppercase tracking-wider"
                style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg) translateY(-50%)' }}
            >
                Species Richness
            </div>
        </div>
    );
};
