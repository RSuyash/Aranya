import type { PlotBlueprint } from './types';

export const STD_10x10_QUADRANTS: PlotBlueprint = {
    id: 'std-10x10-4q',
    version: 1,
    name: 'Standard 10x10m (4 Quadrants)',
    root: {
        type: 'CONTAINER',
        label: 'Main Plot',
        code: 'P',
        role: 'MAIN_PLOT',
        shape: { kind: 'RECTANGLE', width: 10, length: 10 },
        childrenGenerator: {
            method: 'GRID',
            grid: {
                rows: 2,
                cols: 2,
                rowOrder: 'TOP_TO_BOTTOM',
                colOrder: 'LEFT_TO_RIGHT',
                labelPattern: 'Q{idx}', // Q1..Q4
                startIndex: 1,
            },
        },
    },
};

export const STD_20x20_QUADRANTS: PlotBlueprint = {
    id: 'std-20x20-4q',
    version: 1,
    name: 'Standard 20x20m (4 Quadrants)',
    root: {
        type: 'CONTAINER',
        label: 'Main Plot',
        code: 'P',
        role: 'MAIN_PLOT',
        shape: { kind: 'RECTANGLE', width: 20, length: 20 },
        childrenGenerator: {
            method: 'GRID',
            grid: {
                rows: 2,
                cols: 2,
                rowOrder: 'TOP_TO_BOTTOM',
                colOrder: 'LEFT_TO_RIGHT',
                labelPattern: 'Q{idx}',
                startIndex: 1,
            },
        },
    },
};

export const CIRCULAR_10M_FULL: PlotBlueprint = {
    id: 'cir-10m-full',
    version: 1,
    name: 'Circular 10m Radius (Single Unit)',
    root: {
        type: 'SAMPLING_UNIT', // It IS the unit
        label: 'Main Plot',
        code: 'P',
        role: 'MAIN_PLOT',
        shape: { kind: 'CIRCLE', radius: 10 },
        // No children
    },
};

// NEW: Demonstrates FIXED_LIST method with herb subplots at specific positions
export const STD_10x10_WITH_HERB_SUBPLOTS: PlotBlueprint = {
    id: 'std-10x10-herb-subplots',
    version: 1,
    name: '10x10m with Corner Herb Subplots',
    root: {
        type: 'CONTAINER',
        label: 'Main Plot',
        code: 'P',
        role: 'MAIN_PLOT',
        shape: { kind: 'RECTANGLE', width: 10, length: 10 },
        childrenGenerator: {
            method: 'FIXED_LIST',
            children: [
                // Northwest corner herb subplot
                {
                    definition: {
                        type: 'SAMPLING_UNIT',
                        label: 'Herb-NW',
                        code: 'H-NW',
                        role: 'SUBPLOT',
                        shape: { kind: 'RECTANGLE', width: 1, length: 1 },
                        tags: ['herb', 'ground_vegetation']
                    },
                    position: {
                        parentAnchor: 'TOP_LEFT',
                        childAnchor: 'TOP_LEFT',
                        offsetX: 0.5,
                        offsetY: -0.5
                    }
                },
                // Northeast corner herb subplot
                {
                    definition: {
                        type: 'SAMPLING_UNIT',
                        label: 'Herb-NE',
                        code: 'H-NE',
                        role: 'SUBPLOT',
                        shape: { kind: 'RECTANGLE', width: 1, length: 1 },
                        tags: ['herb', 'ground_vegetation']
                    },
                    position: {
                        parentAnchor: 'TOP_RIGHT',
                        childAnchor: 'TOP_RIGHT',
                        offsetX: -0.5,
                        offsetY: -0.5
                    }
                },
                // Southwest corner herb subplot
                {
                    definition: {
                        type: 'SAMPLING_UNIT',
                        label: 'Herb-SW',
                        code: 'H-SW',
                        role: 'SUBPLOT',
                        shape: { kind: 'RECTANGLE', width: 1, length: 1 },
                        tags: ['herb', 'ground_vegetation']
                    },
                    position: {
                        parentAnchor: 'BOTTOM_LEFT',
                        childAnchor: 'BOTTOM_LEFT',
                        offsetX: 0.5,
                        offsetY: 0.5
                    }
                },
                // Southeast corner herb subplot
                {
                    definition: {
                        type: 'SAMPLING_UNIT',
                        label: 'Herb-SE',
                        code: 'H-SE',
                        role: 'SUBPLOT',
                        shape: { kind: 'RECTANGLE', width: 1, length: 1 },
                        tags: ['herb', 'ground_vegetation']
                    },
                    position: {
                        parentAnchor: 'BOTTOM_RIGHT',
                        childAnchor: 'BOTTOM_RIGHT',
                        offsetX: -0.5,
                        offsetY: 0.5
                    }
                }
            ]
        }
    }
};

export const BLUEPRINTS = {
    [STD_10x10_QUADRANTS.id]: STD_10x10_QUADRANTS,
    [STD_20x20_QUADRANTS.id]: STD_20x20_QUADRANTS,
    [CIRCULAR_10M_FULL.id]: CIRCULAR_10M_FULL,
    [STD_10x10_WITH_HERB_SUBPLOTS.id]: STD_10x10_WITH_HERB_SUBPLOTS,
};

export const BlueprintRegistry = {
    get: (id: string) => BLUEPRINTS[id],
    getAll: () => Object.values(BLUEPRINTS),
};