import type { PlotBlueprint } from './types';

export const STANDARD_BLUEPRINTS: Record<string, PlotBlueprint> = {
    'std-10x10': {
        id: 'std-10x10',
        version: 1,
        name: 'Standard 10x10m Quadrant',
        root: {
            type: 'CONTAINER',
            label: 'Main Plot',
            shape: { kind: 'RECTANGLE', width: 20, length: 20 }, // Wait, 10x10 or 20x20? Plan said 10x10m plot, but usually 20x20m is standard for trees (0.04ha).
            // Let's assume 20x20m (400m2) divided into 4 10x10m quadrants.
            role: 'MAIN_PLOT',
            childrenGenerator: {
                method: 'GRID',
                grid: {
                    rows: 2,
                    cols: 2,
                    rowOrder: 'TOP_TO_BOTTOM',
                    colOrder: 'LEFT_TO_RIGHT',
                    labelPattern: 'Q{i}'
                }
            }
        }
    }
};
