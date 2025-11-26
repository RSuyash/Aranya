import React from 'react';
import type { TreeVizNode } from '../../viz/buildPlotVizModel';

interface TreesLayerProps {
    trees: TreeVizNode[];
    visible?: boolean;
    onEditTree?: (treeId: string) => void;
}

export const TreesLayer: React.FC<TreesLayerProps> = ({ trees, visible = true, onEditTree }) => {
    if (!visible) return null;
    return (
        <svg
            className="absolute inset-0 pointer-events-none"
            style={{ width: '100%', height: '100%' }}
        >
            <defs>
                {/* Radial gradient for tree markers */}
                <radialGradient id="tree-gradient">
                    <stop offset="0%" style={{ stopColor: '#52d273', stopOpacity: 1 }} />
                    <stop offset="70%" style={{ stopColor: '#3ab65c', stopOpacity: 0.95 }} />
                    <stop offset="100%" style={{ stopColor: '#2a9847', stopOpacity: 0.9 }} />
                </radialGradient>

                {/* Drop shadow filter */}
                <filter id="tree-shadow" x="-50%" y="-50%" width="200%" height="200%">
                    <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#52d273" floodOpacity="0.4" />
                </filter>
            </defs>

            {trees.map((tree) => (
                <g
                    key={tree.id}
                    className={`tree-marker pointer-events-auto group ${onEditTree ? 'cursor-pointer' : ''}`}
                    onClick={(e) => {
                        e.stopPropagation();
                        onEditTree?.(tree.id);
                    }}
                >
                    {/* Outer ring for depth */}
                    <circle
                        cx={tree.screenX}
                        cy={tree.screenY}
                        r={tree.radius + 2}
                        fill="none"
                        stroke="rgba(82, 210, 115, 0.3)"
                        strokeWidth={1.5}
                        className="transition-all duration-300 group-hover:stroke-[rgba(82,210,115,0.6)]"
                    />

                    {/* Main tree circle */}
                    <circle
                        cx={tree.screenX}
                        cy={tree.screenY}
                        r={tree.radius}
                        fill="url(#tree-gradient)"
                        filter="url(#tree-shadow)"
                        className="transition-all duration-300"
                    />

                    {/* Inner highlight for 3D effect */}
                    <circle
                        cx={tree.screenX - tree.radius * 0.3}
                        cy={tree.screenY - tree.radius * 0.3}
                        r={tree.radius * 0.4}
                        fill="rgba(255, 255, 255, 0.3)"
                        className="pointer-events-none"
                    />

                    {/* Tooltip */}
                    <title>{tree.speciesName}{tree.gbh ? ` (${tree.gbh}cm)` : ''}</title>
                </g>
            ))}
        </svg>
    );
};
