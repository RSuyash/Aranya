import { v4 as uuidv4 } from 'uuid';
import type { PlotBlueprint, PlotNodeDefinition, PlotNodeInstance, ShapeDefinition } from './types';

// Helper to get dimensions from shape
function getDimensions(shape: ShapeDefinition) {
    switch (shape.kind) {
        case 'RECTANGLE': return { width: shape.width, height: shape.length };
        case 'CIRCLE': return { width: shape.radius * 2, height: shape.radius * 2 };
        case 'LINE': return { width: shape.length, height: shape.width || 0.1 };
        case 'POINT': return { width: (shape.radius || 0.1) * 2, height: (shape.radius || 0.1) * 2 };
    }
}

// Recursive function to generate instances
function processNode(
    def: PlotNodeDefinition,
    blueprintId: string,
    blueprintVersion: number,
    path: string,
    x: number,
    y: number,
    plotId?: string
): PlotNodeInstance {
    const instanceId = plotId ? `${plotId}-${path}` : uuidv4(); // Simple ID generation for now

    const instance: PlotNodeInstance = {
        id: instanceId,
        blueprintId,
        blueprintVersion,
        plotId,
        type: def.type,
        label: def.label || 'Node',
        path,
        shape: def.shape,
        x,
        y,
        role: def.role,
        tags: def.tags,
        children: []
    };

    if (def.childrenGenerator) {
        const gen = def.childrenGenerator;
        const parentDims = getDimensions(def.shape);

        if (gen.method === 'GRID') {
            const { rows, cols, rowOrder = 'TOP_TO_BOTTOM', colOrder = 'LEFT_TO_RIGHT' } = gen.grid;
            const cellWidth = parentDims.width / cols;
            const cellHeight = parentDims.height / rows;

            // Assuming child shape matches cell size for now (simplified)
            // In a real engine, we'd check the child definition if it existed in the generator
            // But the current type definition for GRID doesn't specify a child definition, 
            // implying implicit container subdivision or we need to update the type.
            // *Correction*: The plan's GRID generator didn't specify a child definition. 
            // Let's assume it creates generic SAMPLING_UNITs or we need to extend the type.
            // For this implementation, I'll create a default child definition.

            const childDef: PlotNodeDefinition = {
                type: 'SAMPLING_UNIT',
                shape: { kind: 'RECTANGLE', width: cellWidth, length: cellHeight },
                role: 'SUBPLOT'
            };

            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    // Calculate logical indices based on order
                    const logicalRow = rowOrder === 'TOP_TO_BOTTOM' ? (rows - 1 - r) : r; // Y increases upwards
                    // Wait, if TOP_TO_BOTTOM, row 0 is at the top (highest Y).
                    // If height is 20, rows=2. Cell height 10.
                    // Row 0 (Top): Y should be 10. Row 1 (Bottom): Y should be 0.

                    const cellY = rowOrder === 'TOP_TO_BOTTOM'
                        ? (rows - 1 - r) * cellHeight
                        : r * cellHeight;

                    const cellX = colOrder === 'LEFT_TO_RIGHT'
                        ? c * cellWidth
                        : (cols - 1 - c) * cellWidth;

                    const index = r * cols + c + (gen.grid.startIndex || 1);
                    const childPath = `${path}/r${r}c${c}`;

                    const childInstance = processNode(
                        { ...childDef, label: `Q${index}` }, // Simple labeling
                        blueprintId,
                        blueprintVersion,
                        childPath,
                        x + cellX, // Relative to parent? No, absolute in this simple recursion? 
                        // Let's make x,y relative to parent in the instance? 
                        // The plan says "Concrete Geometry (Canonical Meters)". Usually absolute or relative to root.
                        // Let's assume absolute for easier rendering.
                        y + cellY,
                        plotId
                    );
                    instance.children.push(childInstance);
                }
            }
        }
        // Implement NESTED and FIXED_LIST later as needed
    }

    return instance;
}

export function generateLayout(
    blueprint: PlotBlueprint,
    overrides?: { rootDimensions?: ShapeDefinition },
    plotId?: string
): PlotNodeInstance {
    // Apply overrides to root definition if needed
    const rootDef = { ...blueprint.root };
    if (overrides?.rootDimensions) {
        rootDef.shape = overrides.rootDimensions;
    }

    return processNode(
        rootDef,
        blueprint.id,
        blueprint.version,
        'root',
        0,
        0,
        plotId
    );
}
