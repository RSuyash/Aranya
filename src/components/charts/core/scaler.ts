import type { ChartDataSeries, ChartConfig, ScaleResult, MultiAxisScales } from './types';
import { autoFormatter } from './formatter';

// --- Linear Scale Logic (Wilkinson's) ---
function calculateLinearScale(
    values: number[],
    type: 'linear' | 'time',
    options: { forceZero?: boolean; symmetrical?: boolean; steps?: number }
): ScaleResult {
    const { forceZero = false, symmetrical = false, steps = 5 } = options;

    let min = Math.min(...values);
    let max = Math.max(...values);

    // Edge Case: Empty or Flat data
    if (values.length === 0 || min === Infinity) {
        return { min: 0, max: 10, ticks: [0, 5, 10], formatter: autoFormatter(10, type), type };
    }

    if (min === max) {
        if (min === 0) { max = 1; }
        else {
            min = min * 0.9;
            max = max * 1.1;
        }
    }

    // Force Zero Baseline (for Bar charts)
    if (forceZero) {
        if (min > 0) min = 0;
        if (max < 0) max = 0;
    }

    // Symmetrical (for Residuals)
    if (symmetrical) {
        const absMax = Math.max(Math.abs(min), Math.abs(max));
        min = -absMax;
        max = absMax;
    }

    // Calculate "Nice" Step
    const range = max - min;
    const rawStep = range / steps;
    const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
    const normalizedStep = rawStep / magnitude;

    let niceStep;
    if (normalizedStep <= 1) niceStep = 1;
    else if (normalizedStep <= 2) niceStep = 2;
    else if (normalizedStep <= 5) niceStep = 5;
    else niceStep = 10;

    const step = niceStep * magnitude;

    // Expand bounds to match step
    const niceMin = Math.floor(min / step) * step;
    const niceMax = Math.ceil(max / step) * step;

    // Generate Ticks
    const ticks: number[] = [];
    // Safety break to prevent infinite loops on bad math
    let current = niceMin;
    let iterations = 0;
    while (current <= niceMax + (step / 1000) && iterations < 100) {
        ticks.push(current);
        current += step;
        iterations++;
    }

    return {
        min: niceMin,
        max: niceMax,
        ticks,
        formatter: autoFormatter(niceMax, type),
        type
    };
}

// --- Categorical Scale Logic ---
function calculateCategoryScale(values: string[]): ScaleResult {
    const unique = Array.from(new Set(values));
    return {
        min: 0,
        max: unique.length,
        ticks: unique,
        categories: unique,
        formatter: (v) => String(v),
        type: 'category'
    };
}

// --- Main Orchestrator ---
export function calculateMultiAxisScales(
    series: ChartDataSeries[],
    config: ChartConfig
): MultiAxisScales {
    // 1. Calculate X Scale
    let xScale: ScaleResult;
    const xType = series[0]?.xAxisType || 'category';

    if (xType === 'category') {
        const allCategories = series.flatMap(s => s.data.map(d => String(d.x)));
        xScale = calculateCategoryScale(allCategories);
    } else {
        const allX = series.flatMap(s => s.data.map(d => Number(d.x))).filter(n => !isNaN(n));
        xScale = calculateLinearScale(allX, xType === 'time' ? 'time' : 'linear', {
            forceZero: false
        });
    }

    // 2. Calculate Y Scales (Left & Right)
    const leftSeries = series.filter(s => (s.yAxisId || 'left') === 'left');
    const rightSeries = series.filter(s => s.yAxisId === 'right');

    // Helper to get Y values
    const getY = (sList: ChartDataSeries[]) =>
        sList.flatMap(s => s.data.map(d => d.y).filter((y): y is number => y !== null));

    const leftScale = calculateLinearScale(getY(leftSeries), 'linear', {
        forceZero: config.forceZeroBaseline ?? leftSeries.some(s => s.type === 'bar'),
        symmetrical: config.symmetricalDomain
    });

    let rightScale: ScaleResult | undefined = undefined;
    if (rightSeries.length > 0) {
        rightScale = calculateLinearScale(getY(rightSeries), 'linear', {
            forceZero: config.forceZeroBaseline ?? rightSeries.some(s => s.type === 'bar'),
            symmetrical: config.symmetricalDomain
        });
    }

    return { x: xScale, left: leftScale, right: rightScale };
}
