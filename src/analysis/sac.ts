import type { TreeObservation } from '../core/data-model/types';

export interface SACPoint {
    plotsSampled: number;
    richness: number; // Cumulative species count
    sd?: number; // Standard Deviation (for random)
}

/**
 * Calculates Randomized Species Accumulation Curve
 * @param trees All tree observations
 * @param plotIds List of all plot IDs involved in the analysis
 * @param iterations Number of permutations (default 50)
 */
export function calculateSAC(
    trees: TreeObservation[],
    plotIds: string[],
    iterations: number = 50
): SACPoint[] {
    // 1. Map Plot -> Set of Species
    const plotSpeciesMap = new Map<string, Set<string>>();
    plotIds.forEach(id => plotSpeciesMap.set(id, new Set()));

    trees.forEach(t => {
        if (t.isUnknown) return;
        if (plotSpeciesMap.has(t.plotId)) {
            plotSpeciesMap.get(t.plotId)!.add(t.speciesName);
        }
    });

    const n = plotIds.length;
    const results: number[][] = Array(n).fill(0).map(() => []);

    // 2. Permutations
    for (let i = 0; i < iterations; i++) {
        // Shuffle plots
        const shuffled = [...plotIds].sort(() => Math.random() - 0.5);
        const pool = new Set<string>();

        // Accumulate
        shuffled.forEach((pid, idx) => {
            const speciesInPlot = plotSpeciesMap.get(pid)!;
            speciesInPlot.forEach(s => pool.add(s));
            results[idx].push(pool.size);
        });
    }

    // 3. Average
    return results.map((counts, idx) => {
        const mean = counts.reduce((a, b) => a + b, 0) / counts.length;
        // Simple SD calculation
        const variance = counts.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / counts.length;

        return {
            plotsSampled: idx + 1,
            richness: parseFloat(mean.toFixed(2)),
            sd: parseFloat(Math.sqrt(variance).toFixed(2))
        };
    });
}