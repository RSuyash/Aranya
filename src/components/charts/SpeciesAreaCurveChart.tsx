import React, { useState } from 'react';
import { ChartBar, ChartLine, ChartScatter, Eye, Crosshair } from 'lucide-react';
import { SmartChart } from './SmartChart';
import type { SACPoint } from '../../analysis/sac';
import type { ChartDataSeries } from './core/types';
import { clsx } from 'clsx'; // Ensure clsx is installed or use template literals carefully

export interface SACChartProps {
    data: SACPoint[];
    mode?: 'cumulative' | 'random';
    height?: number;
    className?: string;
    defaultChartType?: 'bar' | 'line' | 'scatter';
}

type ChartType = 'bar' | 'line' | 'scatter';

export const SpeciesAreaCurveChart: React.FC<SACChartProps> = ({
    data,
    mode = 'random',
    height = 280,
    className,
    defaultChartType = 'line'
}) => {
    const [chartType, setChartType] = useState<ChartType>(defaultChartType);

    // View Controls State
    const [showCI, setShowCI] = useState(true);
    const [showCrosshair, setShowCrosshair] = useState(true);

    // Adapter: Transform SAC Points into SmartChart Series
    // NOTE: passing CSS var string directly to the chart engine
    const series: ChartDataSeries[] = [
        {
            id: 'richness',
            name: 'Species Richness',
            type: chartType,
            xAxisType: 'linear',
            yAxisType: 'linear',
            color: 'var(--primary)', // <--- THE FIX: CSS Variable
            data: data.map(pt => ({
                x: pt.plotsSampled,
                y: pt.richness,
                meta: {
                    sd: pt.sd,
                    effort: pt.plotsSampled
                }
            }))
        }
    ];

    const chartOptions: { type: ChartType; icon: React.ReactNode; label: string }[] = [
        { type: 'bar', icon: <ChartBar size={16} />, label: 'Bar' },
        { type: 'line', icon: <ChartLine size={16} />, label: 'Line' },
        { type: 'scatter', icon: <ChartScatter size={16} />, label: 'Scatter' },
    ];

    return (
        <div className="space-y-4">
            {/* Enhanced Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3">

                {/* Left: View Toggles */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowCI(!showCI)}
                        className={clsx(
                            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border",
                            showCI
                                ? "bg-primary/10 border-primary/30 text-primary"
                                : "bg-transparent border-border text-text-muted hover:text-text-main hover:bg-panel-soft"
                        )}
                        title="Toggle 95% Confidence Interval"
                    >
                        <Eye size={14} />
                        <span className="hidden sm:inline">Uncertainty</span>
                    </button>

                    <button
                        onClick={() => setShowCrosshair(!showCrosshair)}
                        className={clsx(
                            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border",
                            showCrosshair
                                ? "bg-primary/10 border-primary/30 text-primary"
                                : "bg-transparent border-border text-text-muted hover:text-text-main hover:bg-panel-soft"
                        )}
                        title="Toggle Crosshair Tool"
                    >
                        <Crosshair size={14} />
                        <span className="hidden sm:inline">Inspect</span>
                    </button>
                </div>

                {/* Right: Chart Type Switcher */}
                <div className="flex items-center gap-1 bg-panel-soft border border-border rounded-lg p-1">
                    {chartOptions.map(option => (
                        <button
                            key={option.type}
                            onClick={() => setChartType(option.type)}
                            className={clsx(
                                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all",
                                chartType === option.type
                                    ? "bg-primary text-white shadow-md"
                                    : "text-text-muted hover:text-text-main hover:bg-white/5"
                            )}
                            title={`Switch to ${option.label} chart`}
                        >
                            {option.icon}
                            <span className="hidden sm:inline">{option.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Chart Component */}
            <SmartChart
                series={series}
                config={{
                    xAxisLabel: mode === 'cumulative' ? 'Cumulative Area (Plots)' : 'Sampling Effort (Plots)',
                    yAxisLabel: 'Species Richness (S)',
                    showGrid: true,
                    height: height,
                    forceZeroBaseline: chartType === 'bar',
                    showConfidenceInterval: showCI,
                    showCrosshair: showCrosshair
                }}
                className={className}
            />
        </div>
    );
};