import React from 'react';
import type { UnitVizNode } from '../../viz/buildPlotVizModel';

interface LabelsLayerProps {
    units: UnitVizNode[];
    visible?: boolean;
}

export const LabelsLayer: React.FC<LabelsLayerProps> = ({ units, visible = true }) => {
    if (!visible) return null;

    // Only show labels for subplots or tiny units here.
    // Large Quadrant labels are now handled elegantly by the EnvironmentLayer watermark.
    const relevantUnits = units.filter(u =>
        u.type === 'SAMPLING_UNIT' &&
        u.role !== 'MAIN_PLOT' &&
        (u.role === 'SUBPLOT' || u.screenWidth < 60)
    );

    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {relevantUnits.map(unit => {
                const centerX = unit.screenX + unit.screenWidth / 2;
                const topY = unit.screenY - 8; // Float slightly above

                return (
                    <div
                        key={unit.id}
                        className="absolute flex flex-col items-center justify-center pointer-events-none transition-all duration-300"
                        style={{
                            left: `${centerX}px`,
                            top: `${topY}px`,
                            transform: 'translate(-50%, -100%)', // Anchor bottom-center
                        }}
                    >
                        <span
                            className="text-[10px] font-bold uppercase tracking-widest text-text-main"
                            style={{
                                textShadow: '0 1px 2px var(--bg-app), 0 0 4px var(--bg-app)' // Halo effect for legibility
                            }}
                        >
                            {unit.label}
                        </span>

                        {/* Tiny connection line */}
                        <div className="w-px h-2 bg-text-muted/50 mt-0.5" />
                    </div>
                );
            })}
        </div>
    );
};