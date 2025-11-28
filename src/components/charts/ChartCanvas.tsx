import React, { useState } from 'react';
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

    // NEW: Generate unique ID for clip path to avoid conflicts if multiple charts exist
    const clipId = React.useId();

    // Crosshair state
    const [hoveredPoint, setHoveredPoint] = useState<{ x: number; y: number; seriesId: string; pointIndex: number } | null>(null);

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


    // Find the closest point for crosshair
    const findClosestPoint = (seriesData: ChartDataPoint[], mouseX: number): { point: ChartDataPoint | null; index: number } => {
        let closestPoint: ChartDataPoint | null = null;
        let closestDistance = Infinity;
        let closestIndex = -1;

        seriesData.forEach((pt, i) => {
            if (pt.y === null) return;
            const x = getX(pt.x);
            const distance = Math.abs(x - mouseX);
            if (distance < closestDistance) {
                closestDistance = distance;
                closestPoint = pt;
                closestIndex = i;
            }
        });

        return { point: closestPoint, index: closestIndex };
    };

    // Handle mouse move for crosshair
    const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
        const svg = e.currentTarget;
        const pt = svg.createSVGPoint();
        pt.x = e.clientX;
        pt.y = e.clientY;
        const cursor = pt.matrixTransform(svg.getScreenCTM()?.inverse());

        // Adjust for margins
        const adjustedX = cursor.x - m.left;

        // Find the closest point across all series
        for (const s of series) {
            if (s.type === 'line' || s.type === 'scatter') {
                const { point, index } = findClosestPoint(s.data, adjustedX);
                if (point) {
                    // Only show crosshair if mouse is close enough to a data point
                    if (Math.abs(getX(point.x) - adjustedX) < 20) {
                        setHoveredPoint({
                            x: getX(point.x),
                            y: getY(point.y, s.yAxisId || 'left')!,
                            seriesId: s.id,
                            pointIndex: index
                        });
                        return;
                    }
                }
            }
        }
        setHoveredPoint(null);
    };

    // Handle mouse leave
    const handleMouseLeave = () => {
        setHoveredPoint(null);
    };

    return (
        <svg
            width={width}
            height={height}
            className="overflow-visible"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
        >
            <defs>
                {/* FIX 1: Define the Clipping Mask */}
                <clipPath id={clipId}>
                    <rect x={0} y={0} width={innerWidth} height={innerHeight} />
                </clipPath>
            </defs>

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

                {/* Data Layer (Apply Clipping Here) */}
                <g clipPath={`url(#${clipId})`}>
                    {series.map(s => {
                        const axisId = s.yAxisId || 'left';
                        const color = s.color || 'var(--primary)';

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
                            // FIX 2: Toggles for CI Ribbon
                            let ciPath = null;
                            // Check BOTH data availability AND user config
                            const shouldShowCI = config.showConfidenceInterval !== false; // Default true

                            if (shouldShowCI && s.data.some(pt => pt.meta?.sd !== undefined)) {
                                // Build upper and lower confidence interval paths
                                const ciPoints = s.data.filter(pt => pt.y !== null);
                                if (ciPoints.length > 0) {
                                    const upperPath: string[] = [];
                                    const lowerPath: string[] = [];

                                    ciPoints.forEach((pt) => {
                                        if (pt.y === null || pt.meta?.sd === undefined) return;

                                        const x = getX(pt.x);
                                        const ciValue = pt.meta?.sd !== undefined && typeof pt.meta.sd === 'number' ? 1.96 * pt.meta.sd : 0; // 95% CI: μ ± 1.96σ
                                        const upperY = getY(pt.y + ciValue, axisId);
                                        const lowerY = getY(pt.y - ciValue, axisId);

                                        // Clamp values to stay within the axis bounds
                                        const clampedUpperY = upperY !== null ? Math.max(0, Math.min(innerHeight, upperY)) : null;
                                        const clampedLowerY = lowerY !== null ? Math.max(0, Math.min(innerHeight, lowerY)) : null;

                                        if (clampedUpperY !== null && clampedLowerY !== null) {
                                            upperPath.push(`${upperPath.length === 0 ? 'M' : 'L'} ${x},${clampedUpperY}`);
                                            lowerPath.unshift(`L ${x},${clampedLowerY}`);
                                        }
                                    });

                                    if (upperPath.length > 0 && lowerPath.length > 0) {
                                        ciPath = upperPath.join(' ') + ' ' + lowerPath.join(' ') + ' Z';
                                    }
                                }
                            }

                            return (
                                <g key={s.id}>
                                    {/* Render CI only if path exists */}
                                    {ciPath && (
                                        <path
                                            d={ciPath}
                                            fill={color}
                                            fillOpacity={0.15} // Keep it subtle
                                            stroke="none"
                                        />
                                    )}

                                    {/* Render Main Line */}
                                    <path
                                        d={generatePath(s.data, axisId)}
                                        fill="none"
                                        stroke={color}
                                        strokeWidth={2}
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />

                                    {/* Add markers for hover interaction */}
                                    {s.data.map((pt, i) => {
                                        if (pt.y === null) return null;
                                        return (
                                            <circle
                                                key={i}
                                                cx={getX(pt.x)}
                                                cy={getY(pt.y, axisId)!}
                                                r={4}
                                                fill={color}
                                                stroke="var(--bg-app)"
                                                strokeWidth={1}
                                                opacity={0.7} // More visible to enhance interaction
                                            >
                                                <title>{`${s.name}: ${pt.y}${pt.meta?.sd !== undefined && typeof pt.meta.sd === 'number' ? ` (±${(1.96 * pt.meta.sd).toFixed(2)} CI)` : ''
                                                    }`}</title>
                                            </circle>
                                        );
                                    })}
                                </g>
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
                                                stroke="var(--bg-app)"
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

                {/* Crosshair Layer */}
                {/* FIX 3: Check config before rendering crosshair */}
                {hoveredPoint && config.showCrosshair !== false && (
                    <g pointerEvents="none">
                        {/* Vertical line */}
                        <line
                            x1={hoveredPoint.x}
                            y1={0}
                            x2={hoveredPoint.x}
                            y2={innerHeight}
                            stroke="var(--text-main)"
                            strokeWidth={1}
                            strokeDasharray="4,4"
                            opacity={0.7}
                        />
                        {/* Horizontal line */}
                        <line
                            x1={0}
                            y1={hoveredPoint.y}
                            x2={innerWidth}
                            y2={hoveredPoint.y}
                            stroke="var(--text-main)"
                            strokeWidth={1}
                            strokeDasharray="4,4"
                            opacity={0.7}
                        />
                        {/* Highlight circle on the point */}
                        <circle
                            cx={hoveredPoint.x}
                            cy={hoveredPoint.y}
                            r={6}
                            fill="none"
                            stroke="var(--text-main)"
                            strokeWidth={2}
                            opacity={0.9}
                        />
                    </g>
                )}
            </g>
        </svg>
    );
};