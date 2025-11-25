import React from 'react';
import type { TreeVizNode } from '../../viz/buildPlotVizModel';

interface TreesLayerProps {
    trees: TreeVizNode[];
}

export const TreesLayer: React.FC<TreesLayerProps> = ({ trees }) => {
    return (
        <svg
            className="absolute inset-0 pointer-events-none"
            style={{ width: '100%', height: '100%', zIndex: 10 }}
        >
            {trees.map(tree => (
                <g key={tree.id}>
                    {/* Tree shadow */}
                    <circle
                        cx={tree.screenX}
                        cy={tree.screenY + 2}
                        r={tree.radius}
                        fill="rgba(0, 0, 0, 0.2)"
                        className="pointer-events-none"
                    />

                    {/* Tree body */}
                    <circle
                        cx={tree.screenX}
                        cy={tree.screenY}
                        r={tree.radius}
                        fill="#52d273"
                        stroke="#45b564"
                        strokeWidth={2}
                        className="pointer-events-auto cursor-pointer hover:scale-110 transition-transform"
                        style={{ transformOrigin: `${tree.screenX}px ${tree.screenY}px` }}
                    >
                        <title>{tree.speciesName} - {tree.gbh || 'N/A'} cm GBH</title>
                    </circle>
                </g>
            ))}
        </svg>
    );
};
