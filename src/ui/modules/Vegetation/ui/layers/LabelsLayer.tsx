import React from 'react';
import type { UnitVizNode } from '../../viz/buildPlotVizModel';

interface LabelsLayerProps {
    units: UnitVizNode[];
    visible?: boolean;
}

export const LabelsLayer: React.FC<LabelsLayerProps> = ({ units, visible = true }) => {
    if (!visible) return null;
    return (
        <div className="absolute inset-0 pointer-events-none">
            {units
                .filter(u => u.type === 'SAMPLING_UNIT' && u.role !== 'MAIN_PLOT')
                .map(unit => {
                    const centerX = unit.screenX + unit.screenWidth / 2;
                    const centerY = unit.screenY + unit.screenHeight / 2;

                    return (
                        <div
                            key={unit.id}
                            className="absolute pointer-events-none animate-in fade-in duration-500"
                            style={{
                                left: `${centerX}px`,
                                top: `${centerY}px`,
                                transform: 'translate(-50%, -50%)',
                            }}
                        >
                            {/* Label Card - Different style for Subplots */}
                            {unit.role === 'SUBPLOT' ? (
                                <div className="text-success font-bold text-sm tracking-widest opacity-80 select-none">
                                    {unit.label}
                                </div>
                            ) : (
                                <div className="backdrop-blur-sm bg-panel/90 px-4 py-2 rounded-lg border border-border shadow-xl">
                                    <div className="text-center">
                                        {/* Unit Name */}
                                        <div className="text-text-main font-semibold text-lg tracking-wide">
                                            {unit.label}
                                        </div>

                                        {/* Tree Count Badge */}
                                        {unit.treeCount > 0 && (
                                            <div className="flex items-center justify-center gap-1.5 mt-1">
                                                <div className="w-2 h-2 rounded-full bg-success shadow-sm shadow-success/50"></div>
                                                <span className="text-success text-xs font-medium">
                                                    {unit.treeCount} {unit.treeCount === 1 ? 'tree' : 'trees'}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
        </div>
    );
};
