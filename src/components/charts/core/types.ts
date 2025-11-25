// Polymorphic axis value: timestamps (number) or categories (string)
export type AxisValue = number | string;

export interface ChartDataPoint {
    x: AxisValue;
    y: number | null; // null allows for gaps in line charts
    meta?: Record<string, unknown>;       // Extra context for tooltips
}

export interface ChartDataSeries {
    id: string;
    name: string;
    data: ChartDataPoint[];

    // Critical for renderer to know how to handle the axis
    xAxisType: 'category' | 'linear' | 'time' | 'log';
    yAxisType?: 'linear' | 'log';
    yAxisId?: 'left' | 'right'; // Support for Dual-Axis

    type: 'bar' | 'line' | 'scatter' | 'area';
    color?: string; // Hex override
}

export interface ChartConfig {
    title?: string;
    xAxisLabel?: string;
    yAxisLabel?: string;
    height?: number; // Fixed height (width is responsive)
    showGrid?: boolean;
    showLegend?: boolean;

    // NEW: Interactive Controls
    showConfidenceInterval?: boolean; // Default: true
    showCrosshair?: boolean;          // Default: true

    // Scaling Overrides
    yAxisDomain?: [number, number];
    forceZeroBaseline?: boolean;    // Default: true for bars
    symmetricalDomain?: boolean;    // For residual plots
}

// Result of the AutoScaler
export interface ScaleResult {
    min: number; // For linear/time: domain min. For category: 0
    max: number; // For linear/time: domain max. For category: count
    ticks: (number | string)[];
    formatter: (value: number | string) => string;
    type: 'category' | 'linear' | 'time' | 'log';

    // Helper for categorical mapping
    categories?: string[];
}

export interface MultiAxisScales {
    x: ScaleResult;
    left: ScaleResult;
    right?: ScaleResult;
}
