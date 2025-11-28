import type { PlotConfiguration } from '../../../../core/plot-engine/types';

export interface PlotTemplate {
    id: string;
    name: string;
    description: string;
    config: PlotConfiguration;
}

export const PLOT_TEMPLATES: PlotTemplate[] = [
    {
        id: 'standard-10x10',
        name: 'Standard 10x10m',
        description: 'The gold standard for vegetation sampling. 100m² area divided into 4 quadrants (5x5m).',
        config: {
            shape: 'RECTANGLE',
            dimensions: { width: 10, length: 10 },
            grid: {
                enabled: true,
                rows: 2,
                cols: 2,
                labelStyle: 'Q1-Q4'
            },
            subplots: {
                enabled: false,
                rules: []
            },
            rules: {
                minInterTreeDistance: 0.5
            }
        }
    },
    {
        id: 'standard-20x20',
        name: 'Large Forest Plot (20x20m)',
        description: '400m² plot for high-density mature forests. Divided into 4 quadrants (10x10m).',
        config: {
            shape: 'RECTANGLE',
            dimensions: { width: 20, length: 20 },
            grid: {
                enabled: true,
                rows: 2,
                cols: 2,
                labelStyle: 'Q1-Q4'
            },
            subplots: {
                enabled: false,
                rules: []
            },
            rules: {
                minInterTreeDistance: 0.5
            }
        }
    },
    {
        id: 'circular-10m',
        name: 'Circular Plot (10m Radius)',
        description: 'Circular plot (~314m²) used for rapid assessment. Divided into 4 sectors.',
        config: {
            shape: 'CIRCLE',
            dimensions: { width: 20, length: 20, radius: 10 },
            grid: {
                enabled: true,
                rows: 2,
                cols: 2,
                labelStyle: 'Q1-Q4'
            },
            subplots: {
                enabled: false,
                rules: []
            },
            rules: {
                minInterTreeDistance: 0.5
            }
        }
    },
    {
        id: 'transect-50x5',
        name: 'Gentry Transect Segment (50x2m)',
        description: 'A long, narrow transect (100m²) for diversity studies. Often used in sets of 10.',
        config: {
            shape: 'RECTANGLE',
            dimensions: { width: 2, length: 50 },
            grid: {
                enabled: true,
                rows: 10,
                cols: 1,
                labelStyle: 'Alpha'
            },
            subplots: {
                enabled: false,
                rules: []
            },
            rules: {
                minInterTreeDistance: 0.2
            }
        }
    },
    {
        id: 'nested-regeneration',
        name: 'Nested Regeneration Plot (20x20m)',
        description: 'Advanced 20x20m plot with dedicated 5x5m corner subplots for sampling regeneration and herbs.',
        config: {
            shape: 'RECTANGLE',
            dimensions: { width: 20, length: 20 },
            grid: {
                enabled: true,
                rows: 2,
                cols: 2,
                labelStyle: 'Q1-Q4'
            },
            subplots: {
                enabled: true,
                rules: [
                    { type: 'fixed', shape: 'RECTANGLE', dimensions: { width: 5, length: 5 }, position: 'CORNER_SW', excludesCanopy: false, strata: ['HERB', 'SAPLING'] },
                    { type: 'fixed', shape: 'RECTANGLE', dimensions: { width: 5, length: 5 }, position: 'CORNER_SE', excludesCanopy: false, strata: ['HERB', 'SAPLING'] },
                    { type: 'fixed', shape: 'RECTANGLE', dimensions: { width: 5, length: 5 }, position: 'CORNER_NW', excludesCanopy: false, strata: ['HERB', 'SAPLING'] },
                    { type: 'fixed', shape: 'RECTANGLE', dimensions: { width: 5, length: 5 }, position: 'CORNER_NE', excludesCanopy: false, strata: ['HERB', 'SAPLING'] }
                ]
            },
            rules: {
                minInterTreeDistance: 0.5
            }
        }
    }
];