import React from 'react';
import type { UnitVizNode } from '../../viz/buildPlotVizModel';
import { clsx } from 'clsx';

interface EnvironmentLayerProps {
    units: UnitVizNode[];
    selectedUnitId?: string;
    onSelectUnit?: (unitId: string) => void;
    showQuadrants: boolean;
    showSubplots: boolean;
}

export const EnvironmentLayer: React.FC<EnvironmentLayerProps> = ({
    units, selectedUnitId, onSelectUnit, showQuadrants, showSubplots
}) => {
    // Sort to ensure subplots render on top
    const sortedUnits = [...units].sort((a, b) => a.zIndex - b.zIndex);

    return (
        <g className="environment-layer">
            <defs>
                {/* Clean Hatch Pattern for Subplots */}
                <pattern id="hatch-diagonal" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                    <rect width="2" height="8" transform="translate(0,0)" fill="currentColor" fillOpacity="0.3" />
                </pattern>

                {/* Selection Glow */}
                <filter id="selection-glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
            </defs>

            {sortedUnits.map(unit => {
                const isQuadrant = unit.role === 'QUADRANT';
                const isSubplot = unit.role === 'SUBPLOT';
                const isMain = unit.role === 'MAIN_PLOT';
                const isInteractive = unit.type === 'SAMPLING_UNIT' && !isMain;
                const isSelected = selectedUnitId === unit.id;

                if (isMain) {
                    // Handle main plot specially - render quadrant divisions
                    const centerX = unit.screenX + unit.screenWidth / 2;
                    const centerY = unit.screenY + unit.screenHeight / 2;

                    return (
                        <g key={unit.id}>
                            {/* Horizontal quadrant division - made more visible */}
                            <line
                                x1={unit.screenX}
                                y1={centerY}
                                x2={unit.screenX + unit.screenWidth}
                                y2={centerY}
                                stroke="var(--primary)"  /* Use primary color for high visibility */
                                strokeWidth={2}
                                strokeDasharray="8 6"
                                opacity={0.9}
                            />
                            {/* Vertical quadrant division - made more visible */}
                            <line
                                x1={centerX}
                                y1={unit.screenY}
                                x2={centerX}
                                y2={unit.screenY + unit.screenHeight}
                                stroke="var(--primary)"  /* Use primary color for high visibility */
                                strokeWidth={2}
                                strokeDasharray="8 6"
                                opacity={0.9}
                            />
                            {/* Q1 Label (Top Right) - enhanced visibility */}
                            <text
                                x={centerX + unit.screenWidth / 4}
                                y={centerY - unit.screenHeight / 4}
                                textAnchor="middle"
                                dominantBaseline="middle"
                                className="font-bold text-[14px] uppercase select-none pointer-events-none"
                                fill="var(--primary)"
                                opacity={0.9}
                                style={{
                                    textShadow: '0 0 3px var(--bg-app), 0 0 6px var(--primary), 0 0 10px var(--primary)' // Enhanced glow effect
                                }}
                            >
                                Q1
                            </text>
                            {/* Q2 Label (Top Left) - enhanced visibility */}
                            <text
                                x={centerX - unit.screenWidth / 4}
                                y={centerY - unit.screenHeight / 4}
                                textAnchor="middle"
                                dominantBaseline="middle"
                                className="font-bold text-[14px] uppercase select-none pointer-events-none"
                                fill="var(--primary)"
                                opacity={0.9}
                                style={{
                                    textShadow: '0 0 3px var(--bg-app), 0 0 6px var(--primary), 0 0 10px var(--primary)' // Enhanced glow effect
                                }}
                            >
                                Q2
                            </text>
                            {/* Q3 Label (Bottom Left) - enhanced visibility */}
                            <text
                                x={centerX - unit.screenWidth / 4}
                                y={centerY + unit.screenHeight / 4}
                                textAnchor="middle"
                                dominantBaseline="middle"
                                className="font-bold text-[14px] uppercase select-none pointer-events-none"
                                fill="var(--primary)"
                                opacity={0.9}
                                style={{
                                    textShadow: '0 0 3px var(--bg-app), 0 0 6px var(--primary), 0 0 10px var(--primary)' // Enhanced glow effect
                                }}
                            >
                                Q3
                            </text>
                            {/* Q4 Label (Bottom Right) - enhanced visibility */}
                            <text
                                x={centerX + unit.screenWidth / 4}
                                y={centerY + unit.screenHeight / 4}
                                textAnchor="middle"
                                dominantBaseline="middle"
                                className="font-bold text-[14px] uppercase select-none pointer-events-none"
                                fill="var(--primary)"
                                opacity={0.9}
                                style={{
                                    textShadow: '0 0 3px var(--bg-app), 0 0 6px var(--primary), 0 0 10px var(--primary)' // Enhanced glow effect
                                }}
                            >
                                Q4
                            </text>
                        </g>
                    );
                }
                if (isQuadrant && !showQuadrants) return null;
                if (isSubplot && !showSubplots) return null;

                // --- Geometry with Gaps ---
                const gap = isQuadrant ? 2 : 0;
                const x = unit.screenX + gap;
                const y = unit.screenY + gap;
                const w = Math.max(0, unit.screenWidth - (gap * 2));
                const h = Math.max(0, unit.screenHeight - (gap * 2));

                // --- Appearance Logic ---
                let fill = "transparent";
                let stroke = "var(--border)";
                let strokeWidth = 1;
                let strokeDash = "0";
                let fillOpacity = 0.05;

                // Status Colors
                if (unit.status === 'DONE') {
                    fill = "var(--success)"; // Will apply low opacity via style
                    stroke = "var(--success)";
                    strokeWidth = 2;
                    fillOpacity = 0.1;
                } else if (unit.status === 'IN_PROGRESS') {
                    fill = "var(--primary)";
                    stroke = "var(--primary)";
                    strokeWidth = 2;
                    fillOpacity = 0.1;
                } else {
                    strokeDash = "4 4";
                    // For "not started" units, use more visible borders in dark mode
                    stroke = "var(--text-muted)";
                }

                // Selection Override
                if (isSelected) {
                    stroke = "var(--primary)";
                    strokeWidth = 3;
                    strokeDash = "0";
                }

                // --- Label Rendering (No Boxes!) ---
                // We render text directly with a stroke for contrast
                const labelColor = unit.status === 'NOT_STARTED' ? 'var(--text-main)' :  // Use text-main for better visibility in dark mode
                    unit.status === 'DONE' ? 'var(--success)' : 'var(--primary)';

                // For subplots, make sure borders and labels are more visible
                const subplotBorderColor = isSubplot ? 'var(--warning)' : stroke;
                const subplotBorderWidth = isSubplot ? 2 : strokeWidth;

                return (
                    <g
                        key={unit.id}
                        onClick={isInteractive && onSelectUnit ? (e) => { e.stopPropagation(); onSelectUnit(unit.id); } : undefined}
                        className={clsx(
                            isInteractive && "cursor-pointer transition-all duration-300",
                            isSelected ? "opacity-100 z-10" : "opacity-90 hover:opacity-100"
                        )}
                        pointerEvents="bounding-box"
                    >
                        {/* 1. The Unit Body */}
                        <rect
                            x={x} y={y} width={w} height={h}
                            rx={isSubplot ? 6 : 4}
                            fill={fill}
                            fillOpacity={isSubplot ? 0.15 : fillOpacity} // Slightly higher opacity for subplots
                            stroke={subplotBorderColor}  // Use enhanced subplot border when needed
                            strokeWidth={subplotBorderWidth}  // Use enhanced subplot border width when needed
                            strokeDasharray={strokeDash}
                            filter={isSelected ? "url(#selection-glow)" : undefined}
                        />

                        {/* 2. Subplot Hatching Overlay */}
                        {isSubplot && (
                            <rect
                                x={x} y={y} width={w} height={h} rx={6}
                                fill="url(#hatch-diagonal)"
                                className="text-warning" // Controls hatch color via currentColor
                                style={{ pointerEvents: 'none', opacity: 0.3 }} // Ensure visibility in dark mode
                            />
                        )}

                        {/* 3. The Label (Floating, No Box) */}
                        <text
                            x={x + 4}
                            y={y + 12}
                            className="font-bold text-[10px] uppercase tracking-widest select-none pointer-events-none"
                            fill={labelColor}
                            style={{
                                textShadow: '0 0 3px var(--bg-app), 0 0 5px var(--bg-app)' // Halo effect
                            }}
                        >
                            {unit.label}
                        </text>

                        {/* 4. Status Icon (Bottom Right) */}
                        <g transform={`translate(${x + w - 16}, ${y + h - 16})`} className="pointer-events-none">
                            {unit.status === 'DONE' && (
                                <circle cx="8" cy="8" r="3" fill="var(--success)" />
                            )}
                            {unit.status === 'IN_PROGRESS' && (
                                <circle cx="8" cy="8" r="3" fill="var(--primary)" className="animate-pulse" />
                            )}
                        </g>
                    </g>
                );
            })}
        </g>
    );
};