import type { PlotBlueprint, PlotNodeInstance, PlotNodeDefinition, ShapeDefinition } from './types';
import { makeInstanceId } from './utils';

export function generateLayout(
    blueprint: PlotBlueprint,
    overrides?: { rootDimensions?: ShapeDefinition },
    plotId?: string,
): PlotNodeInstance {
    const rootDef = blueprint.root;
    const rootShape = overrides?.rootDimensions || rootDef.shape;

    return processNode(
        rootDef,
        rootShape,
        { x: 0, y: 0 },
        'root',
        blueprint.id,
        blueprint.version,
        plotId
    );
}

function processNode(
    def: PlotNodeDefinition,
    shape: ShapeDefinition,
    offset: { x: number; y: number },
    path: string,
    blueprintId: string,
    version: number,
    plotId?: string
): PlotNodeInstance {
    const id = makeInstanceId(plotId, blueprintId, version, path);

    const instance: PlotNodeInstance = {
        id,
        blueprintId,
        blueprintVersion: version,
        plotId,
        type: def.type,
        label: def.label || 'Node',
        path,
        shape,
        x: offset.x,
        y: offset.y,
        role: def.role,
        tags: def.tags,
        children: [],
    };

    if (def.childrenGenerator) {
        const gen = def.childrenGenerator;

        if (gen.method === 'GRID') {
            // Grid Logic
            if (shape.kind !== 'RECTANGLE') {
                console.warn('Grid generator only supported for RECTANGLE parents');
                return instance;
            }

            const rows = gen.grid.rows;
            const cols = gen.grid.cols;
            const cellWidth = shape.width / cols;
            const cellHeight = shape.length / rows;

            const rowOrder = gen.grid.rowOrder || 'TOP_TO_BOTTOM';
            const colOrder = gen.grid.colOrder || 'LEFT_TO_RIGHT';
            const startIndex = gen.grid.startIndex || 1;

            let idx = 0;
            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    // Calculate position (bottom-left of the cell)
                    let cellY = 0;
                    if (rowOrder === 'TOP_TO_BOTTOM') {
                        cellY = shape.length - (r + 1) * cellHeight;
                    } else {
                        cellY = r * cellHeight;
                    }

                    let cellX = 0;
                    if (colOrder === 'LEFT_TO_RIGHT') {
                        cellX = c * cellWidth;
                    } else {
                        cellX = shape.width - (c + 1) * cellWidth;
                    }

                    const childPath = `${path}/r${r}c${c}`;
                    const label = gen.grid.labelPattern
                        ? gen.grid.labelPattern.replace('{idx}', (startIndex + idx).toString())
                            .replace('{r}', (r + 1).toString())
                            .replace('{c}', (c + 1).toString())
                        : `Q${startIndex + idx}`;

                    const childShape: ShapeDefinition = { kind: 'RECTANGLE', width: cellWidth, length: cellHeight };

                    // Create a synthetic definition for the child
                    const childDef: PlotNodeDefinition = {
                        type: 'SAMPLING_UNIT',
                        label: label,
                        shape: childShape,
                        role: 'QUADRANT', // Grid children are quadrants, not subplots
                    };

                    instance.children.push(processNode(
                        childDef,
                        childShape,
                        { x: cellX, y: cellY },
                        childPath,
                        blueprintId,
                        version,
                        plotId
                    ));

                    idx++;
                }
            }
        } else if (gen.method === 'NESTED') {
            // Center child
            const childDef = gen.child;
            let childX = 0;
            let childY = 0;

            if (shape.kind === 'RECTANGLE' && childDef.shape.kind === 'RECTANGLE') {
                childX = (shape.width - childDef.shape.width) / 2;
                childY = (shape.length - childDef.shape.length) / 2;
            } else if (shape.kind === 'CIRCLE' && childDef.shape.kind === 'CIRCLE') {
                childX = shape.radius - childDef.shape.radius;
                childY = shape.radius - childDef.shape.radius;
            }

            instance.children.push(processNode(
                childDef,
                childDef.shape,
                { x: childX, y: childY },
                `${path}/nested`,
                blueprintId,
                version,
                plotId
            ));

        } else if (gen.method === 'FIXED_LIST') {
            gen.children.forEach((childItem, i) => {
                const childDef = childItem.definition;
                const pos = childItem.position;

                // Calculate X,Y based on anchors
                let px = 0, py = 0;
                if (shape.kind === 'RECTANGLE') {
                    switch (pos.parentAnchor) {
                        case 'CENTER': px = shape.width / 2; py = shape.length / 2; break;
                        case 'TOP_LEFT': px = 0; py = shape.length; break;
                        case 'TOP_RIGHT': px = shape.width; py = shape.length; break;
                        case 'BOTTOM_LEFT': px = 0; py = 0; break;
                        case 'BOTTOM_RIGHT': px = shape.width; py = 0; break;
                    }
                }

                // Child Anchor (default CENTER)
                let cx = 0, cy = 0;
                if (childDef.shape.kind === 'RECTANGLE') {
                    const cw = childDef.shape.width;
                    const cl = childDef.shape.length;
                    const anchor = pos.childAnchor || 'CENTER';
                    switch (anchor) {
                        case 'CENTER': cx = cw / 2; cy = cl / 2; break;
                        case 'TOP_LEFT': cx = 0; cy = cl; break;
                        case 'TOP_RIGHT': cx = cw; cy = cl; break;
                        case 'BOTTOM_LEFT': cx = 0; cy = 0; break;
                        case 'BOTTOM_RIGHT': cx = cw; cy = 0; break;
                    }
                }

                const finalX = px - cx + (pos.offsetX || 0);
                const finalY = py - cy + (pos.offsetY || 0);

                instance.children.push(processNode(
                    childDef,
                    childDef.shape,
                    { x: finalX, y: finalY },
                    `${path}/child${i}`,
                    blueprintId,
                    version,
                    plotId
                ));
            });
        }
    }

    return instance;
}
