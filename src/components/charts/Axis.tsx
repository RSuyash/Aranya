import React from 'react';
import type { ScaleResult } from './core/types';

interface AxisProps {
    scale: ScaleResult;
    orientation: 'left' | 'right' | 'bottom';
    width: number;
    height: number;
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

    const getPos = (val: number | string, idx: number) => {
        if (scale.type === 'category') {
            const step = isHorizontal ? width / scale.max : height / scale.max;
            return (idx * step) + (step / 2);
        }
        const range = scale.max - scale.min;
        const normalized = (Number(val) - scale.min) / range;

        if (isHorizontal) return normalized * width;
        return height - (normalized * height);
    };

    // Semantic Classes for "HUD" look
    const gridClass = "stroke-border opacity-20";
    const axisClass = "stroke-border opacity-50";
    const textClass = "fill-text-muted text-[10px] font-mono font-medium tracking-tight";
    const labelClass = "fill-text-muted text-[10px] font-bold uppercase tracking-[0.2em] opacity-70";

    return (
        <g className="axis" transform={isRight ? `translate(${width}, 0)` : ''}>
            {/* Grid Lines: Subtle, contextual guidance */}
            {showGrid && scale.ticks.map((tick, i) => {
                const pos = getPos(tick, i);
                return isHorizontal ? (
                    <line key={`grid-${i}`} x1={pos} y1={0} x2={pos} y2={-height}
                        className={gridClass} strokeDasharray="4 4" />
                ) : (
                    <line key={`grid-${i}`} x1={0} y1={pos} x2={width} y2={pos}
                        className={gridClass} strokeDasharray="4 4" />
                );
            })}

            {/* Main Axis Line */}
            {isHorizontal ? (
                <line x1={0} y1={0} x2={width} y2={0} className={axisClass} />
            ) : (
                <line x1={0} y1={0} x2={0} y2={height} className={axisClass} />
            )}

            {/* Ticks & Values */}
            {scale.ticks.map((tick, i) => {
                const pos = getPos(tick, i);
                const text = scale.formatter(tick);

                if (isHorizontal) {
                    return (
                        <g key={i} transform={`translate(${pos}, 0)`}>
                            <line y2={4} className={axisClass} />
                            <text y={16} textAnchor="middle" className={textClass}>{text}</text>
                        </g>
                    );
                } else {
                    return (
                        <g key={i} transform={`translate(0, ${pos})`}>
                            <line x2={isRight ? 4 : -4} className={axisClass} />
                            <text
                                x={isRight ? 8 : -8}
                                dy={4}
                                textAnchor={isRight ? "start" : "end"}
                                className={textClass}
                            >
                                {text}
                            </text>
                        </g>
                    );
                }
            })}

            {/* Axis Title */}
            {label && (
                <text
                    x={isHorizontal ? width / 2 : -height / 2}
                    y={isHorizontal ? 36 : (isRight ? 40 : -40)}
                    transform={isHorizontal ? '' : 'rotate(-90)'}
                    textAnchor="middle"
                    className={labelClass}
                >
                    {label}
                </text>
            )}
        </g>
    );
};