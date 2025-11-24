import React from 'react';
import clsx from 'clsx';

interface QuadrantProps {
    id: string;
    x: number; // Logical X (meters)
    y: number; // Logical Y (meters)
    size: number; // Logical Size (meters)
    label: string;
    status: 'empty' | 'in-progress' | 'completed';
    scale?: number; // Injected by GridContainer
    onClick?: () => void;
}

export const Quadrant: React.FC<QuadrantProps> = ({
    x,
    y,
    size,
    label,
    status,
    scale = 1,
    onClick,
}) => {
    const statusColors = {
        empty: 'bg-white/5 border-white/10 text-text-muted',
        'in-progress': 'bg-primary/10 border-primary/30 text-primary',
        completed: 'bg-success/10 border-success/30 text-success',
    };

    return (
        <div
            onClick={onClick}
            style={{
                left: x * scale,
                top: y * scale,
                width: size * scale,
                height: size * scale,
            }}
            className={clsx(
                'absolute border transition-all duration-200 flex items-center justify-center cursor-pointer hover:brightness-110',
                statusColors[status]
            )}
        >
            <span className="text-xs font-medium select-none" style={{ fontSize: Math.max(10, 12 * (scale / 20)) }}>
                {label}
            </span>
        </div>
    );
};
