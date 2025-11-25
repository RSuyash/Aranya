import { v4 as uuidv4 } from 'uuid';
import type { PlotConfiguration, PlotNodeInstance, ShapeDefinition, SubplotRule } from './types';

/**
 * Generates a dynamic plot layout based on the provided configuration.
 * Replaces the static blueprint system.
 */
export function generateDynamicLayout(config: PlotConfiguration, plotId: string): PlotNodeInstance {
    const { dimensions, shape } = config;

    // 1. Create Root Container (Main Plot)
    const rootShape: ShapeDefinition = shape === 'RECTANGLE'
        ? { kind: 'RECTANGLE', width: dimensions.width, length: dimensions.length }
        : { kind: 'CIRCLE', radius: dimensions.radius || 0 };

    const root: PlotNodeInstance = {
        id: uuidv4(),
        blueprintId: 'dynamic',
        blueprintVersion: 1,
        plotId: plotId,
        type: 'CONTAINER',
        label: 'Main Plot',
        path: 'root',
        shape: rootShape,
        x: 0,
        y: 0,
        rotation: 0,
        role: 'MAIN_PLOT',
        children: []
    };

    // 2. Generate Grid (Quadrants)
    if (config.grid.enabled && shape === 'RECTANGLE') {
        const { rows, cols, labelStyle } = config.grid;
        const cellWidth = dimensions.width / cols;
        const cellLength = dimensions.length / rows;

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                // Precision Math: Use parseFloat(toFixed(2)) to avoid floating point drift
                // Grid coordinates usually start from top-left or bottom-left depending on system.
                // Assuming Cartesian (Bottom-Left is 0,0) for data storage.
                // Row 0 is bottom, Row 1 is top.

                // However, standard grid iteration often goes Top-to-Bottom.
                // Let's stick to Cartesian for X/Y:
                // Col 0 -> x = 0
                // Row 0 -> y = 0 (Bottom)

                const x = parseFloat((c * cellWidth).toFixed(2));
                const y = parseFloat((r * cellLength).toFixed(2));

                // Label Generation
                let label = '';
                if (labelStyle === 'Q1-Q4') {
                    // Standard Z-order or reading order? 
                    // Usually Q1=NE, Q2=NW, Q3=SW, Q4=SE (Math) OR Q1=NW, Q2=NE... (Reading)
                    // Let's use simple index for now: Q1..Q4 reading left-to-right, bottom-to-top?
                    // Let's assume standard reading order (Top-Left start) for labels, but coords are Cartesian.
                    // If r=0 is bottom, r=rows-1 is top.

                    // Map (r,c) to 1-based index. 
                    // If we want Q1 to be Top-Left (r=1, c=0 in 2x2):
                    // index = (rows - 1 - r) * cols + c + 1
                    const index = (rows - 1 - r) * cols + c + 1;
                    label = `Q${index}`;
                } else if (labelStyle === 'Matrix') {
                    label = `${r + 1},${c + 1}`;
                } else {
                    label = `Cell ${r}-${c}`;
                }

                const cell: PlotNodeInstance = {
                    id: uuidv4(),
                    blueprintId: 'dynamic',
                    blueprintVersion: 1,
                    plotId: plotId,
                    type: 'SAMPLING_UNIT',
                    label: label,
                    path: `root/grid/${r}/${c}`,
                    shape: { kind: 'RECTANGLE', width: cellWidth, length: cellLength },
                    x: x,
                    y: y,
                    role: 'QUADRANT',
                    children: []
                };

                root.children.push(cell);
            }
        }
    }

    // 3. Generate Subplots
    // Subplots are added as children of the Root to allow independent layering/Z-index.
    if (config.subplots.enabled) {
        config.subplots.rules.forEach((rule) => {
            const subplots = generateSubplots(rule, config.dimensions, plotId);
            root.children.push(...subplots);
        });
    }

    return root;
}

function generateSubplots(rule: SubplotRule, plotDims: { width: number; length: number }, plotId: string): PlotNodeInstance[] {
    const instances: PlotNodeInstance[] = [];

    if (rule.type === 'fixed') {
        const width = rule.dimensions.width || 1;
        const length = rule.dimensions.length || 1;
        const shape: ShapeDefinition = { kind: 'RECTANGLE', width, length }; // Assuming Rect for now

        let x = 0;
        let y = 0;

        // Calculate Position
        switch (rule.position) {
            case 'CORNER_SW':
                x = 0;
                y = 0;
                break;
            case 'CORNER_SE':
                x = plotDims.width - width;
                y = 0;
                break;
            case 'CORNER_NW':
                x = 0;
                y = plotDims.length - length;
                break;
            case 'CORNER_NE':
                x = plotDims.width - width;
                y = plotDims.length - length;
                break;
            case 'CENTER':
                x = (plotDims.width - width) / 2;
                y = (plotDims.length - length) / 2;
                break;
        }

        instances.push({
            id: uuidv4(),
            blueprintId: 'dynamic',
            blueprintVersion: 1,
            plotId: plotId,
            type: 'SAMPLING_UNIT',
            label: rule.position === 'CENTER' ? 'Center' : rule.position.replace('CORNER_', ''),
            path: `root/subplot/${rule.position}`,
            shape: shape,
            x: parseFloat(x.toFixed(2)),
            y: parseFloat(y.toFixed(2)),
            role: 'SUBPLOT',
            tags: rule.excludesCanopy ? ['excludes-canopy'] : [],
            children: []
        });
    }

    // TODO: Handle 'random' placement if needed later

    return instances;
}
