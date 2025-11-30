import React from 'react';
import type { PlotNodeInstance } from '../../core/plot-engine/types';
import { clsx } from 'clsx';

// Helper to calculate pixel dimensions based on shape kind
function getNodePixelSize(node: PlotNodeInstance, scale: number) {
    const shape = node.shape;
    switch (shape.kind) {
        case 'RECTANGLE':
            return { width: shape.width * scale, height: shape.length * scale };
        case 'CIRCLE':
            return { width: shape.radius * 2 * scale, height: shape.radius * 2 * scale };
        case 'LINE':
            return { width: shape.length * scale, height: (shape.width ?? 0.1) * scale };
        case 'POINT':
            const r = (shape.radius ?? 0.1) * scale;
            return { width: r * 2, height: r * 2 };
    }
}

interface TreeData {
    id: string;
    gbh?: number;
    samplingUnitId: string;
}

interface PlotRendererProps {
    root: PlotNodeInstance;
    pixelWidth: number;
    onSelectSamplingUnit?: (node: PlotNodeInstance) => void;
    selectedNodeId?: string;
    samplingUnitStatusMap?: Record<string, 'NOT_STARTED' | 'IN_PROGRESS' | 'DONE'>;
    treeCountMap?: Record<string, number>;
    treeData?: TreeData[];
}

export const PlotRenderer: React.FC<PlotRendererProps> = ({
    root,
    pixelWidth,
    onSelectSamplingUnit,
    selectedNodeId,
    samplingUnitStatusMap = {},
    treeCountMap = {},
    treeData = []
}) => {
    // Calculate scale based on root width
    const rootMetricWidth = root.shape.kind === 'RECTANGLE' ? root.shape.width :
        root.shape.kind === 'CIRCLE' ? root.shape.radius * 2 :
            root.shape.kind === 'LINE' ? root.shape.length : 10;

    const scale = pixelWidth / rootMetricWidth;

    // Calculate container height
    const rootMetricHeight = root.shape.kind === 'RECTANGLE' ? root.shape.length :
        root.shape.kind === 'CIRCLE' ? root.shape.radius * 2 :
            root.shape.kind === 'LINE' ? (root.shape.width ?? 0.1) : 10;

    // Generate stable random tree positions per sampling unit
    const generateTreePositions = (samplingUnitId: string, width: number, height: number) => {
        const trees = treeData.filter(t => t.samplingUnitId === samplingUnitId);
        const positions: Array<{ x: number; y: number; size: number; id: string }> = [];

        trees.forEach((tree) => {
            // Use tree ID as seed for consistent positioning
            const seed = tree.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
            const random1 = (Math.sin(seed * 12.9898) * 43758.5453) % 1;
            const random2 = (Math.cos(seed * 78.233) * 43758.5453) % 1;

            // GBH to radius (GBH in cm, convert to visual size)
            // Typical tree GBH: 30-100cm, map to 3-10px radius
            const gbh = tree.gbh || 40;
            const radius = Math.max(3, Math.min(10, (gbh / 10)));

            // Position with margin from edges
            const margin = radius + 2;
            const x = margin + (Math.abs(random1) * (width - 2 * margin));
            const y = margin + (Math.abs(random2) * (height - 2 * margin));

            positions.push({ x, y, size: radius, id: tree.id });
        });

        return positions;
    };

    const renderNode = (node: PlotNodeInstance) => {
        const { width, height } = getNodePixelSize(node, scale);

        // Status styling - Now using SEMANTIC tokens
        const status = samplingUnitStatusMap[node.id];
        let statusClass = 'border-border bg-panel-soft/20'; // Default empty
        if (status === 'DONE') statusClass = 'border-success bg-success/10';
        if (status === 'IN_PROGRESS') statusClass = 'border-primary bg-primary/10';

        // Selection styling
        const isSelected = selectedNodeId === node.id;
        const selectionClass = isSelected ? 'ring-2 ring-primary z-10 shadow-lg shadow-primary/20' : '';

        // Tree count
        const treeCount = treeCountMap[node.id] || 0;

        const style: React.CSSProperties = {
            position: 'absolute',
            left: node.x * scale,
            bottom: node.y * scale,
            width,
            height,
        };

        const isInteractive = node.type === 'SAMPLING_UNIT';

        return (
            <div
                key={node.id}
                style={style}
                className={clsx(
                    'absolute border transition-all duration-300',
                    statusClass,
                    selectionClass,
                    isInteractive && 'cursor-pointer hover:bg-panel-soft/80'
                )}
                onClick={(e) => {
                    if (isInteractive && onSelectSamplingUnit) {
                        e.stopPropagation();
                        onSelectSamplingUnit(node);
                    }
                }}
                title={`${node.label} (${node.role})`}
            >
                {/* Label */}
                {width > 30 && height > 20 && (
                    <div className="absolute top-2 left-2 text-xs font-bold text-text-main bg-panel/90 px-1.5 py-0.5 rounded pointer-events-none backdrop-blur-sm border border-border">
                        {node.label}
                    </div>
                )}

                {/* Tree Count Badge */}
                {isInteractive && treeCount > 0 && (
                    <div className="absolute bottom-2 right-2 bg-success text-app text-[9px] font-bold px-1.5 py-0.5 rounded-full pointer-events-none shadow-sm flex items-center gap-1">
                        {treeCount}
                    </div>
                )}

                {/* Tree Dots Visualization */}
                {isInteractive && treeCount > 0 && (() => {
                    const treePositions = generateTreePositions(node.id, width, height);
                    return treePositions.map((tree) => (
                        <div
                            key={tree.id}
                            className="absolute rounded-full bg-success border border-success/50 pointer-events-none opacity-80"
                            style={{
                                left: tree.x,
                                bottom: tree.y,
                                width: tree.size * 2,
                                height: tree.size * 2,
                                transform: 'translate(-50%, 50%)'
                            }}
                        />
                    ));
                })()}

                {/* Render Children */}
                {node.children.map(renderNode)}
            </div>
        );
    };

    return (
        <div
            className="relative bg-app shadow-inner border border-border overflow-hidden rounded-lg"
            style={{ width: pixelWidth, height: rootMetricHeight * scale }}
        >
            {renderNode(root)}
        </div>
    );
};