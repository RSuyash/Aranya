import React from 'react';
import type { UnitVizNode } from '../../viz/buildPlotVizModel';

interface UnitsLayerProps {
    units: UnitVizNode[];
    selectedUnitId?: string;
    onSelectUnit?: (unitId: string) => void;
    showQuadrants?: boolean;
    showSubplots?: boolean;
    showQuadrantLines?: boolean;
}

export const UnitsLayer: React.FC<UnitsLayerProps> = ({ units, selectedUnitId, onSelectUnit, showQuadrants = true, showSubplots = true, showQuadrantLines = false }) => {
    // Filter based on role-specific visibility settings
    const filteredUnits = units.filter(u => {
        if (u.role === 'QUADRANT' && !showQuadrants) return false;
        if (u.role === 'SUBPLOT' && !showSubplots) return false;
        return true;
    });
    const sortedUnits = [...filteredUnits].sort((a, b) => a.zIndex - b.zIndex);

    // Debug logging
    console.log('UnitsLayer: Rendering', units.length, 'units');
    const subplots = units.filter(u => u.role === 'SUBPLOT');
    console.log('UnitsLayer: Found', subplots.length, 'subplots:', subplots.map(s => s.label));
    console.log('UnitsLayer: All units:', units.map(u => ({ id: u.id, label: u.label, role: u.role, type: u.type })));

    return (
        <svg
            className="absolute inset-0 pointer-events-none"
            style={{ width: '100%', height: '100%' }}
        >
            <defs>
                {/* Gradient definitions for modern look */}
                <linearGradient id="quadrant-gradient-not-started" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style={{ stopColor: '#1a2332', stopOpacity: 0.8 }} />
                    <stop offset="100%" style={{ stopColor: '#0f1419', stopOpacity: 0.9 }} />
                </linearGradient>
                <linearGradient id="quadrant-gradient-in-progress" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style={{ stopColor: '#1e3a5f', stopOpacity: 0.85 }} />
                    <stop offset="100%" style={{ stopColor: '#0f1e33', stopOpacity: 0.95 }} />
                </linearGradient>
                <linearGradient id="quadrant-gradient-done" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style={{ stopColor: '#1a3d2e', stopOpacity: 0.85 }} />
                    <stop offset="100%" style={{ stopColor: '#0d2419', stopOpacity: 0.95 }} />
                </linearGradient>

                {/* Subplot-specific gradient - GREEN for visibility */}
                <linearGradient id="subplot-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style={{ stopColor: '#1a3d2e', stopOpacity: 0.9 }} />
                    <stop offset="100%" style={{ stopColor: '#0d2419', stopOpacity: 0.95 }} />
                </linearGradient>

                {/* Glow filter for selection */}
                <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                    <feMerge>
                        <feMergeNode in="coloredBlur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
            </defs>

            {/* Quadrant Lines - render for main plot */}
            {showQuadrantLines && (() => {
                const mainPlot = units.find(u => u.role === 'MAIN_PLOT');
                if (!mainPlot) return null;

                const centerX = mainPlot.screenX + mainPlot.screenWidth / 2;
                const centerY = mainPlot.screenY + mainPlot.screenHeight / 2;

                return (
                    <g className="quadrant-lines" opacity={0.6}>
                        {/* Horizontal line */}
                        <line
                            x1={mainPlot.screenX}
                            y1={centerY}
                            x2={mainPlot.screenX + mainPlot.screenWidth}
                            y2={centerY}
                            stroke="#52d273"
                            strokeWidth={2}
                            strokeDasharray="8 4"
                        />
                        {/* Vertical line */}
                        <line
                            x1={centerX}
                            y1={mainPlot.screenY}
                            x2={centerX}
                            y2={mainPlot.screenY + mainPlot.screenHeight}
                            stroke="#52d273"
                            strokeWidth={2}
                            strokeDasharray="8 4"
                        />
                    </g>
                );
            })()}

            {sortedUnits.map(unit => {
                const isSelected = selectedUnitId === unit.id;
                const isInteractive = unit.type === 'SAMPLING_UNIT' && unit.role !== 'MAIN_PLOT';
                const isSubplot = unit.role === 'SUBPLOT';

                // Choose gradient based on status and type
                let gradientId = 'quadrant-gradient-not-started';
                if (unit.status === 'IN_PROGRESS') {
                    gradientId = 'quadrant-gradient-in-progress';
                } else if (unit.status === 'DONE') {
                    gradientId = 'quadrant-gradient-done';
                }

                return (
                    <g key={unit.id}>
                        {/* Main unit rectangle - subplots have green dashed borders */}
                        <rect
                            x={unit.screenX}
                            y={unit.screenY}
                            width={unit.screenWidth}
                            height={unit.screenHeight}
                            fill={unit.role === 'MAIN_PLOT' ? unit.fillColor : `url(#${gradientId})`}
                            stroke={isSubplot ? '#52d273' : unit.strokeColor}
                            strokeWidth={isSubplot ? 3 : (isSelected ? 3 : 1.5)}
                            strokeDasharray={isSubplot ? '6 3' : undefined}
                            opacity={unit.role === 'MAIN_PLOT' ? 0.3 : (isSubplot ? 1.0 : 0.95)}
                            className={isInteractive ? 'pointer-events-auto cursor-pointer transition-all duration-300' : ''}
                            onClick={isInteractive && onSelectUnit ? () => onSelectUnit(unit.id) : undefined}
                            filter={isSelected ? '(#glow)' : undefined}
                            rx={isSubplot ? 4 : 2}
                        />

                        {/* Subtle inner border for depth */}
                        {isInteractive && (
                            <rect
                                x={unit.screenX + 2}
                                y={unit.screenY + 2}
                                width={unit.screenWidth - 4}
                                height={unit.screenHeight - 4}
                                fill="none"
                                stroke={isSubplot ? "rgba(82, 210, 115, 0.3)" : "rgba(255, 255, 255, 0.1)"}
                                strokeWidth={1}
                                rx={isSubplot ? 3 : 1}
                                className="pointer-events-none"
                            />
                        )}

                        {/* Selection ring with pulse animation */}
                        {isSelected && (
                            <>
                                <rect
                                    x={unit.screenX - 4}
                                    y={unit.screenY - 4}
                                    width={unit.screenWidth + 8}
                                    height={unit.screenHeight + 8}
                                    fill="none"
                                    stroke="#56ccf2"
                                    strokeWidth={2.5}
                                    rx={unit.role === 'SUBPLOT' ? 6 : 3}
                                    className="pointer-events-none"
                                    opacity={0.8}
                                >
                                    <animate
                                        attributeName="opacity"
                                        values="0.8;0.4;0.8"
                                        dur="2s"
                                        repeatCount="indefinite"
                                    />
                                </rect>
                                <rect
                                    x={unit.screenX - 6}
                                    y={unit.screenY - 6}
                                    width={unit.screenWidth + 12}
                                    height={unit.screenHeight + 12}
                                    fill="none"
                                    stroke="#56ccf2"
                                    strokeWidth={1}
                                    rx={unit.role === 'SUBPLOT' ? 7 : 4}
                                    className="pointer-events-none"
                                    opacity={0.3}
                                />
                            </>
                        )}
                    </g>
                );
            })}
        </svg>
    );
};
