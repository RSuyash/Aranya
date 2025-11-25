import type { TreeObservation } from '../core/data-model/types';

/**
 * Calculates Shannon-Wiener Index (H')
 * H' = -sum(pi * ln(pi))
 */
export function calculateShannonIndex(counts: number[]): number {
    const total = counts.reduce((sum, n) => sum + n, 0);
    if (total === 0) return 0;

    return counts.reduce((h, n) => {
        if (n === 0) return h;
        const pi = n / total;
        return h - (pi * Math.log(pi));
    }, 0);
}

/**
 * Calculates Simpson's Index (D)
 * D = sum(pi^2)
 * Returns 1 - D (Simpson's Diversity Index)
 */
export function calculateSimpsonIndex(counts: number[]): number {
    const total = counts.reduce((sum, n) => sum + n, 0);
    if (total === 0) return 0;

    const D = counts.reduce((sum, n) => {
        const pi = n / total;
        return sum + (pi * pi);
    }, 0);

    return 1 - D;
}

/**
 * Basal Area Calculation (m2) from GBH (cm)
 * BA = GBH^2 / 4π
 */
export function calculateBasalArea(gbhCm: number): number {
    const gbhM = gbhCm / 100;
    return (gbhM * gbhM) / (4 * Math.PI);
}

export interface SpeciesStats {
    speciesName: string;
    abundance: number;     // Raw count
    basalArea: number;     // Sum of BA
    frequency: number;     // % of plots present
    ivi: number;           // Importance Value Index
}

export function calculateCommunityMetrics(
    trees: TreeObservation[],
    totalPlots: number
): SpeciesStats[] {
    const map = new Map<string, { count: number; ba: number; plots: Set<string> }>();

    // 1. Aggregate Data
    trees.forEach(t => {
        if (t.isUnknown) return;
        const name = t.speciesName;
        if (!map.has(name)) map.set(name, { count: 0, ba: 0, plots: new Set() });

        const entry = map.get(name)!;
        entry.count += 1; // Or use stemCount if provided
        entry.ba += calculateBasalArea(t.gbh || 0);
        entry.plots.add(t.plotId);
    });

    // 2. Calculate Totals for Relative Metrics
    const totalIndividuals = trees.length;
    const totalBasalArea = Array.from(map.values()).reduce((sum, v) => sum + v.ba, 0);
    const sumFrequencies = Array.from(map.values()).reduce((sum, v) => sum + (v.plots.size / totalPlots), 0);

    // 3. Compute Metrics
    return Array.from(map.entries()).map(([name, data]) => {
        const RD = (data.count / totalIndividuals) * 100; // Relative Density (Simplified)
        const RDo = (data.ba / totalBasalArea) * 100;     // Relative Dominance
        const RF = ((data.plots.size / totalPlots) / sumFrequencies) * 100; // Relative Frequency

        return {
            speciesName: name,
            abundance: data.count,
            basalArea: data.ba,
            frequency: (data.plots.size / totalPlots) * 100,
            ivi: RD + RDo + RF
        };
    }).sort((a, b) => b.ivi - a.ivi);
}