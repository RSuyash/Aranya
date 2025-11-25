import React, { useState } from 'react';
import { ChartBar, ChartLine, ChartScatter } from 'lucide-react';
import { SmartChart } from './SmartChart';
import type { SACPoint } from '../../analysis/sac';
import type { ChartDataSeries } from './core/types';

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

    // Adapter: Transform SAC Points into SmartChart Series
    const series: ChartDataSeries[] = [
        {
            id: 'richness',
            name: 'Species Richness',
            type: chartType,
            xAxisType: 'linear',
            yAxisType: 'linear',
            color: '#56ccf2',
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
        <div className="space-y-3">
            {/* Chart Type Selector - Above the chart */}
            <div className="flex items-center justify-end">
                <div className="flex items-center gap-1 bg-[#0b1020] border border-[#1d2440] rounded-lg p-1">
                    {chartOptions.map(option => (
                        <button
                            key={option.type}
                            onClick={() => setChartType(option.type)}
                            className={`
                                flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all
                                ${chartType === option.type
                                    ? 'bg-[#56ccf2] text-[#050814] shadow-lg shadow-[#56ccf2]/20'
                                    : 'text-[#9ba2c0] hover:text-[#f5f7ff] hover:bg-[#1d2440]/50'
                                }
                            `}
                            title={`Switch to ${option.label} chart`}
                        >
                            {option.icon}
                            <span className="hidden sm:inline">{option.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Chart */}
            <SmartChart
                series={series}
                config={{
                    xAxisLabel: mode === 'cumulative' ? 'Cumulative Area (Plots)' : 'Sampling Effort (Plots)',
                    yAxisLabel: 'Species Richness (S)',
                    showGrid: true,
                    height: height,
                    forceZeroBaseline: chartType === 'bar'
                }}
                className={className}
            />
        </div>
    );
};
