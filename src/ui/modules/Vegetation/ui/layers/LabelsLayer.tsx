import React from 'react';
import type { UnitVizNode } from '../../viz/buildPlotVizModel';

interface LabelsLayerProps {
    units: UnitVizNode[];
}

export const LabelsLayer: React.FC<LabelsLayerProps> = ({ units }) => {
    // Only show labels for sampling units (not main plot container)
    const labeledUnits = units.filter(u => u.type === 'SAMPLING_UNIT' && u.role !== 'MAIN_PLOT');

    return (
        <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 20 }}>
            {labeledUnits.map(unit => {
                const labelX = unit.screenX + unit.screenWidth / 2;
                const labelY = unit.screenY + unit.screenHeight / 2;

                // Don't show label if unit is too small
                if (unit.screenWidth < 40 || unit.screenHeight < 40) return null;

                return (
                    <div
                        key={unit.id}
                        className="absolute"
                        style={{
                            left: labelX,
                            top: labelY,
                            transform: 'translate(-50%, -50%)',
                        }}
                    >
                        {/* Unit label */}
                        <div className="bg-[#0b1020]/90 border border-[#1d2440] rounded-lg px-3 py-1.5 backdrop-blur-sm shadow-lg">
                            <div className="text-sm font-bold text-[#f5f7ff] mb-0.5">{unit.label}</div>
                            {unit.treeCount > 0 && (
                                <div className="flex items-center gap-1.5 text-xs">
                                    <svg className="w-3 h-3 text-[#52d273]" fill="currentColor" viewBox="0 0 20 20">
                                        <circle cx="10" cy="10" r="8" />
                                    </svg>
                                    <span className="text-[#9ba2c0]">{unit.treeCount} tree{unit.treeCount !== 1 ? 's' : ''}</span>
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};
