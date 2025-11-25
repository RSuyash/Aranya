import React from 'react';
import type { ScaleResult } from './core/types';

interface AxisProps {
    scale: ScaleResult;
    orientation: 'left' | 'right' | 'bottom';
    width: number;  // Viewport width (for gridlines)
    height: number; // Viewport height
    showGrid?: boolean;
    label?: string;
}

export const Axis: React.FC<AxisProps> = ({
    scale,
    orientation,
    width,
    height,
    showGrid = false,
    label
}) => {
    const isHorizontal = orientation === 'bottom';
    const isRight = orientation === 'right';

    // Helper to position category ticks in center of band
    const getPos = (val: number | string, idx: number) => {
        if (scale.type === 'category') {
            const step = isHorizontal ? width / scale.max : height / scale.max;
            return (idx * step) + (step / 2);
        }

        // Linear/Time projection
        const range = scale.max - scale.min;
        const normalized = (Number(val) - scale.min) / range;

        if (isHorizontal) {
            return normalized * width;
        } else {
            // Y-axis usually goes Bottom-Up in charts (0 at height), 
            // but SVG y=0 is top. So we invert.
            return height - (normalized * height);
        }
    };

    return (
        <g className="axis" transform={isRight ? `translate(${width}, 0)` : ''}>
            {/* Grid Lines */}
            {showGrid && scale.ticks.map((tick, i) => {
                const pos = getPos(tick, i);
                if (isHorizontal) {
                    return (
                        <line key={`grid-${i}`} x1={pos} y1={0} x2={pos} y2={-height}
                            stroke="#1d2440" strokeDasharray="4 4" />
                    );
                } else {
                    return (
                        <line key={`grid-${i}`} x1={0} y1={pos} x2={width} y2={pos}
                            stroke="#1d2440" strokeDasharray="4 4" />
                    );
                }
            })}

            {/* Axis Line */}
            {isHorizontal ? (
                <line x1={0} y1={0} x2={width} y2={0} stroke="#555b75" />
            ) : (
                <line x1={0} y1={0} x2={0} y2={height} stroke="#555b75" />
            )}

            {/* Ticks & Labels */}
            {scale.ticks.map((tick, i) => {
                const pos = getPos(tick, i);
                const text = scale.formatter(tick);

                if (isHorizontal) {
                    return (
                        <g key={i} transform={`translate(${pos}, 0)`}>
                            <line y2={5} stroke="#555b75" />
                            <text y={18} textAnchor="middle" className="text-[10px] fill-[#9ba2c0] font-mono">
                                {text}
                            </text>
                        </g>
                    );
                } else {
                    return (
                        <g key={i} transform={`translate(0, ${pos})`}>
                            <line x2={isRight ? 5 : -5} stroke="#555b75" />
                            <text
                                x={isRight ? 8 : -8}
                                dy={4}
                                textAnchor={isRight ? "start" : "end"}
                                className="text-[10px] fill-[#9ba2c0] font-mono"
                            >
                                {text}
                            </text>
                        </g>
                    );
                }
            })}

            {/* Axis Label */}
            {label && (
                <text
                    x={isHorizontal ? width / 2 : -height / 2}
                    y={isHorizontal ? 35 : (isRight ? 40 : -40)}
                    transform={isHorizontal ? '' : 'rotate(-90)'}
                    textAnchor="middle"
                    className="text-xs fill-[#f5f7ff] font-medium uppercase tracking-wider"
                >
                    {label}
                </text>
            )}
        </g>
    );
};