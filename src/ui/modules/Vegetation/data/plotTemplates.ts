import type { PlotConfiguration } from '../../../../core/plot-engine/types';

export interface PlotTemplate {
    id: string;
    name: string;
    description: string;
    config: PlotConfiguration;
}

export const PLOT_TEMPLATES: PlotTemplate[] = [
    {
        id: 'standard-20x20',
        name: 'Standard Forest Plot (20x20m)',
        description: 'A standard 400m² square plot divided into 4 quadrants. Suitable for most forest surveys.',
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
        description: 'A circular plot with 10m radius (~314m²). Divided into 4 sectors.',
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
        description: 'A long, narrow transect (100m²). Often used in sets of 10 for Gentry method.',
        config: {
            shape: 'RECTANGLE',
            dimensions: { width: 2, length: 50 },
            grid: {
                enabled: true,
                rows: 10, // 10 segments of 5m length
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
        name: 'Nested Regeneration Plot',
        description: '20x20m main plot with 5x5m subplots in corners for sampling regeneration/herbs.',
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
                    {
                        type: 'fixed',
                        shape: 'RECTANGLE',
                        dimensions: { width: 5, length: 5 },
                        position: 'CORNER_SW',
                        excludesCanopy: false,
                        strata: ['HERB', 'SAPLING']
                    },
                    {
                        type: 'fixed',
                        shape: 'RECTANGLE',
                        dimensions: { width: 5, length: 5 },
                        position: 'CORNER_SE',
                        excludesCanopy: false,
                        strata: ['HERB', 'SAPLING']
                    },
                    {
                        type: 'fixed',
                        shape: 'RECTANGLE',
                        dimensions: { width: 5, length: 5 },
                        position: 'CORNER_NW',
                        excludesCanopy: false,
                        strata: ['HERB', 'SAPLING']
                    },
                    {
                        type: 'fixed',
                        shape: 'RECTANGLE',
                        dimensions: { width: 5, length: 5 },
                        position: 'CORNER_NE',
                        excludesCanopy: false,
                        strata: ['HERB', 'SAPLING']
                    }
                ]
            },
            rules: {
                minInterTreeDistance: 0.5
            }
        }
    }
];
