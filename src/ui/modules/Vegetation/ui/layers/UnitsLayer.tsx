import React from 'react';
import type { UnitVizNode } from '../../viz/buildPlotVizModel';

interface UnitsLayerProps {
    units: UnitVizNode[];
    selectedUnitId?: string;
    onSelectUnit?: (unitId: string) => void;
}

export const UnitsLayer: React.FC<UnitsLayerProps> = ({ units, selectedUnitId, onSelectUnit }) => {
    // Sort by z-index
    const sortedUnits = [...units].sort((a, b) => a.zIndex - b.zIndex);

    return (
        <svg
            className="absolute inset-0 pointer-events-none"
            style={{ width: '100%', height: '100%' }}
        >
            {sortedUnits.map(unit => {
                const isSelected = selectedUnitId === unit.id;
                const isInteractive = unit.type === 'SAMPLING_UNIT' && unit.role !== 'MAIN_PLOT';

                return (
                    <g key={unit.id}>
                        <rect
                            x={unit.screenX}
                            y={unit.screenY}
                            width={unit.screenWidth}
                            height={unit.screenHeight}
                            fill={unit.fillColor}
                            stroke={unit.strokeColor}
                            strokeWidth={unit.strokeWidth}
                            strokeDasharray={unit.role === 'SUBPLOT' ? '4 2' : undefined}
                            className={isInteractive ? 'pointer-events-auto cursor-pointer hover:opacity-80 transition-opacity' : ''}
                            onClick={isInteractive && onSelectUnit ? () => onSelectUnit(unit.id) : undefined}
                            style={{
                                filter: isSelected ? 'drop-shadow(0 0 8px rgba(86, 204, 242, 0.6))' : undefined,
                            }}
                        />

                        {/* Selection ring */}
                        {isSelected && (
                            <rect
                                x={unit.screenX - 3}
                                y={unit.screenY - 3}
                                width={unit.screenWidth + 6}
                                height={unit.screenHeight + 6}
                                fill="none"
                                stroke="#56ccf2"
                                strokeWidth={2}
                                rx={2}
                                className="pointer-events-none animate-pulse"
                            />
                        )}
                    </g>
                );
            })}
        </svg>
    );
};
