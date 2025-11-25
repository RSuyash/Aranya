import type { ChartDataSeries } from './types';

export function sanitizeDataSeries(series: ChartDataSeries[]): ChartDataSeries[] {
    return series.map(s => {
        // Clean Data Points
        const cleanData = s.data.map(pt => {
            let cleanedX = pt.x;

            // Normalize Time to Timestamp
            if (s.xAxisType === 'time') {
                const xValue = pt.x as unknown;
                if (xValue instanceof Date) {
                    cleanedX = xValue.getTime();
                } else if (typeof pt.x === 'string') {
                    // Try parsing ISO string
                    const parsed = Date.parse(pt.x);
                    if (!isNaN(parsed)) {
                        cleanedX = parsed;
                    }
                }
            }

            return {
                ...pt,
                x: cleanedX,
                // Ensure Y is number or null (no NaNs)
                y: (pt.y !== null && isFinite(Number(pt.y))) ? Number(pt.y) : null
            };
        });

        // Filter out completely invalid points (keep nulls for line gaps)
        // For Bar/Scatter, we usually drop nulls. For Line, we keep them.
        const filteredData = cleanData.filter(pt => {
            if (s.type === 'line') return true; // Keep gaps
            return pt.y !== null;
        });

        return {
            ...s,
            data: filteredData
        };
    });
}
