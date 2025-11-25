import React from 'react';
import type { ChartDataSeries, MultiAxisScales, ChartConfig, ChartDataPoint } from './core/types';
import { Axis } from './Axis';

interface ChartCanvasProps {
    series: ChartDataSeries[];
    scales: MultiAxisScales;
    width: number;
    height: number;
    config: ChartConfig;
}

export const ChartCanvas: React.FC<ChartCanvasProps> = ({
    series,
    scales,
    width,
    height,
    config
}) => {
    // Margins
    const m = { top: 20, right: 40, bottom: 40, left: 50 };
    if (scales.right) m.right = 50; // Add room for second axis

    const innerWidth = width - m.left - m.right;
    const innerHeight = height - m.top - m.bottom;

    // --- Helpers to map data to pixels ---
    const getX = (val: number | string) => {
        if (scales.x.type === 'category') {
            const idx = scales.x.categories?.indexOf(String(val)) ?? -1;
            const step = innerWidth / scales.x.max;
            return (idx * step) + (step / 2); // Center of band
        }
        // Linear/Time
        const range = scales.x.max - scales.x.min;
        return ((Number(val) - scales.x.min) / range) * innerWidth;
    };

    const getY = (val: number | null, axis: 'left' | 'right') => {
        if (val === null) return null;
        const scale = axis === 'left' ? scales.left : scales.right!;
        const range = scale.max - scale.min;
        const normalized = (val - scale.min) / range;
        return innerHeight - (normalized * innerHeight); // Invert for SVG
    };

    // --- Path Generator for Lines ---
    const generatePath = (data: ChartDataPoint[], yAxisId: 'left' | 'right') => {
        let path = '';
        let move = true;

        data.forEach((pt) => {
            const x = getX(pt.x);
            const y = getY(pt.y, yAxisId);

            if (y === null) {
                move = true; // Break line
            } else {
                path += `${move ? 'M' : 'L'} ${x},${y} `;
                move = false;
            }
        });
        return path;
    };

    return (
        <svg width={width} height={height} className="overflow-visible">
            <g transform={`translate(${m.left}, ${m.top})`}>

                {/* 1. Axes */}
                <g transform={`translate(0, ${innerHeight})`}>
                    <Axis
                        scale={scales.x}
                        orientation="bottom"
                        width={innerWidth}
                        height={innerHeight}
                        showGrid={config.showGrid}
                        label={config.xAxisLabel}
                    />
                </g>
                <Axis
                    scale={scales.left}
                    orientation="left"
                    width={innerWidth}
                    height={innerHeight}
                    showGrid={config.showGrid}
                    label={config.yAxisLabel}
                />
                {scales.right && (
                    <Axis
                        scale={scales.right}
                        orientation="right"
                        width={innerWidth}
                        height={innerHeight}
                    />
                )}

                {/* 2. Data Series */}
                {series.map(s => {
                    const axisId = s.yAxisId || 'left';
                    const color = s.color || '#56ccf2';

                    if (s.type === 'bar') {
                        // Bar Width Logic
                        const barWidth = scales.x.type === 'category'
                            ? (innerWidth / scales.x.max) * 0.6
                            : 10; // Default fallback for linear bars

                        return (
                            <g key={s.id} className="chart-series-bar">
                                {s.data.map((pt, i) => {
                                    if (pt.y === null) return null;
                                    const x = getX(pt.x) - (barWidth / 2);
                                    const y = getY(pt.y, axisId)!;
                                    const zeroY = getY(0, axisId) ?? innerHeight;
                                    const h = Math.abs(zeroY - y);
                                    const finalY = pt.y >= 0 ? y : zeroY; // Handle negatives

                                    return (
                                        <rect
                                            key={i}
                                            x={x} y={finalY}
                                            width={barWidth} height={h}
                                            fill={color}
                                            className="hover:opacity-80 transition-opacity"
                                        >
                                            <title>{`${s.name}: ${pt.y}`}</title>
                                        </rect>
                                    );
                                })}
                            </g>
                        );
                    }

                    if (s.type === 'line') {
                        return (
                            <path
                                key={s.id}
                                d={generatePath(s.data, axisId)}
                                fill="none"
                                stroke={color}
                                strokeWidth={2}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        );
                    }

                    if (s.type === 'scatter') {
                        return (
                            <g key={s.id}>
                                {s.data.map((pt, i) => {
                                    if (pt.y === null) return null;
                                    return (
                                        <circle
                                            key={i}
                                            cx={getX(pt.x)}
                                            cy={getY(pt.y, axisId)!}
                                            r={4}
                                            fill={color}
                                            stroke="#050814"
                                            strokeWidth={1}
                                        >
                                            <title>{`${s.name}: ${pt.y}`}</title>
                                        </circle>
                                    );
                                })}
                            </g>
                        );
                    }

                    return null;
                })}
            </g>
        </svg>
    );
};