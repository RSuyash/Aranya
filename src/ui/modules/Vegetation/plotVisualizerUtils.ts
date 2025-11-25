import type { SamplingUnitProgress, TreeObservation } from '../../../core/data-model/types';

export type ProgressByUnit = Record<string, SamplingUnitProgress>;

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
 * Currently supports TreeObservations. Can be extended for VegetationObservations.
 */
export function summarizeObservations(
    trees: TreeObservation[],
    // vegs: VegetationObservation[] // Future support
): ObsSummaryByUnit {
    const map: ObsSummaryByUnit = {};

    // Initialize map for all units found in trees
    // Note: We might want to initialize this based on the plot layout nodes instead, 
    // but for now we'll just aggregate what we have data for.
    // The renderer handles missing keys gracefully.

    trees.forEach(tree => {
        const unitId = tree.samplingUnitId;
        if (!map[unitId]) {
            map[unitId] = { treeCount: 0, vegCount: 0 };
        }
        map[unitId].treeCount++;
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
