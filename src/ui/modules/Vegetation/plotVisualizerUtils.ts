import type { SamplingUnitProgress, TreeObservation } from '../../../core/data-model/types';

export type ProgressByUnit = Record<string, SamplingUnitProgress | undefined>;

export type ObsSummaryByUnit = Record<string, {
    treeCount: number;
    vegCount: number;
}>;

/**
 * Normalizes an array of SamplingUnitProgress into a map keyed by samplingUnitId.
 */
export function normalizeProgress(progressList: SamplingUnitProgress[]): ProgressByUnit {
    const map: ProgressByUnit = {};
    progressList.forEach(p => {
        map[p.samplingUnitId] = p;
    });
    return map;
}

/**
 * Summarizes observations per sampling unit.
 * Supports TreeObservations and VegetationObservations.
 */
export function summarizeObservations(
    trees: TreeObservation[],
    vegs: any[] = [] // Default to empty, type as any for now or import VegetationObservation
): ObsSummaryByUnit {
    const map: ObsSummaryByUnit = {};

    // Helper to ensure key exists
    const init = (id: string) => {
        if (!map[id]) map[id] = { treeCount: 0, vegCount: 0 };
    }

    trees.forEach(t => {
        init(t.samplingUnitId);
        map[t.samplingUnitId].treeCount++;
    });

    vegs.forEach(v => {
        init(v.samplingUnitId);
        map[v.samplingUnitId].vegCount++;
    });

    return map;
}

/**
 * Calculates aggregate stats for the entire plot.
 */
export function getAggregateStats(obsSummaryByUnit: ObsSummaryByUnit): { totalTrees: number; totalVeg: number } {
    let totalTrees = 0;
    let totalVeg = 0;

    Object.values(obsSummaryByUnit).forEach(summary => {
        totalTrees += summary.treeCount;
        totalVeg += summary.vegCount;
    });

    return { totalTrees, totalVeg };
}
