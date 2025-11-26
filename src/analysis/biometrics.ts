import { calculateShannonIndex, calculateSimpsonIndex } from './indices';
import type { AnalysisSettings } from '../core/data-model/types';

const PI = Math.PI;

export const DEFAULT_SETTINGS: AnalysisSettings = {
    biomassModel: 'CHAVE_2014_HEIGHT',
    woodDensityStrategy: 'GLOBAL_DEFAULT',
    customWoodDensity: 0.6,
    carbonFraction: 0.47,
    minGbhForCarbon: 10
};

// --- Helpers ---
const gbhToDbh = (gbh: number) => gbh / PI;

// --- Metrics ---

/**
 * Quadratic Mean Diameter (cm)
 * The diameter of the tree of average basal area.
 */
export const calcQMD = (gbhValues: number[]): number => {
    if (gbhValues.length === 0) return 0;
    const sumSqDbh = gbhValues.reduce((sum, gbh) => sum + Math.pow(gbhToDbh(gbh), 2), 0);
    return Math.sqrt(sumSqDbh / gbhValues.length);
};

export const calcBasalArea = (gbhCm: number): number => {
    if (!gbhCm || gbhCm <= 0) return 0;
    const dbhM = (gbhCm / 100) / PI;
    return PI * Math.pow(dbhM / 2, 2);
};

export const calcGini = (gbhValues: number[]): number | null => {
    if (gbhValues.length < 5) return null; // Statistical noise guard
    const sorted = [...gbhValues].sort((a, b) => a - b);
    const n = sorted.length;
    let numerator = 0;
    for (let i = 0; i < n; i++) {
        numerator += (i + 1) * sorted[i];
    }
    const denominator = n * sorted.reduce((a, b) => a + b, 0);
    return (2 * numerator) / denominator - (n + 1) / n;
};

export const calcLoreysHeight = (trees: any[]): number => {
    let totalBA = 0;
    let weightedH = 0;
    trees.forEach(t => {
        if (!t.height) return;
        const ba = calcBasalArea(t.gbh);
        totalBA += ba;
        weightedH += ba * t.height;
    });
    return totalBA > 0 ? weightedH / totalBA : 0;
};

// --- Biomass Models ---

export const calcAGB = (
    gbhCm: number,
    heightM: number | undefined,
    settings: AnalysisSettings
): { agb: number; isEstimate: boolean } => {
    if (!gbhCm) return { agb: 0, isEstimate: false };

    const D_cm = gbhToDbh(gbhCm);
    const WD = settings.customWoodDensity;

    // 1. Model Selection
    switch (settings.biomassModel) {
        case 'CHAVE_2014_HEIGHT':
            // AGB = 0.0673 * (WD * D^2 * H)^0.976
            if (heightM && heightM > 0) {
                return { agb: 0.0673 * Math.pow(WD * Math.pow(D_cm, 2) * heightM, 0.976), isEstimate: false };
            }
            // Fallback estimation
            const H_est = Math.min(45, 5 + 0.5 * D_cm);
            return { agb: 0.0673 * Math.pow(WD * Math.pow(D_cm, 2) * H_est, 0.976), isEstimate: true };

        case 'BROWN_1997_MOIST':
            // Height Independent: AGB = 42.69 - 12.8*D + 1.242*D^2
            if (D_cm < 5) return { agb: 0, isEstimate: true };
            return { agb: 42.69 - 12.8 * D_cm + 1.242 * Math.pow(D_cm, 2), isEstimate: false };

        case 'CHAVE_2005_DRY':
            // AGB = 0.112 * (WD * D^2 * H)^0.916
            const H_dry = heightM || (2 + 0.3 * D_cm); // Shorter fallback
            return {
                agb: 0.112 * Math.pow(WD * Math.pow(D_cm, 2) * H_dry, 0.916),
                isEstimate: !heightM
            };

        default: // Fallback to simple geometric
            return { agb: 0, isEstimate: true };
    }
};

// --- Aggregation ---

export interface StandStructure {
    stemDensityHa: number;
    basalAreaHa: number;
    agbHa: number;
    carbonHa: number;
    qmd: number;          // Replaced meanGbh with QMD
    loreysHeight: number;
    giniCoeff: number | null;
    regenerationCount: number; // New: Future stock
    diversity: { shannon: number | null; simpson: number | null; richness: number; };
    isEstimate: boolean;
}

export const calcStandStructure = (
    trees: any[],
    areaM2: number,
    settings: AnalysisSettings = DEFAULT_SETTINGS
): StandStructure => {
    if (!trees.length || areaM2 <= 0) {
        return {
            stemDensityHa: 0, basalAreaHa: 0, agbHa: 0, carbonHa: 0, qmd: 0, loreysHeight: 0, giniCoeff: null, regenerationCount: 0,
            diversity: { shannon: null, simpson: null, richness: 0 }, isEstimate: false
        };
    }

    let totalBa = 0;
    let totalAgb = 0;
    let estimatedAgbCount = 0;
    let regenCount = 0;
    const gbhList: number[] = [];
    const speciesCount: Record<string, number> = {};

    trees.forEach(t => {
        // Track regeneration (below carbon threshold)
        if (t.gbh < settings.minGbhForCarbon) {
            regenCount++;
            return; // Skip biomass for saplings
        }

        const ba = calcBasalArea(t.gbh);
        const { agb, isEstimate } = calcAGB(t.gbh, t.height, settings);

        totalBa += ba;
        totalAgb += agb;
        gbhList.push(t.gbh);
        if (isEstimate) estimatedAgbCount++;

        const spName = t.isUnknown ? 'Unknown' : t.speciesName;
        speciesCount[spName] = (speciesCount[spName] || 0) + 1;
    });

    const haFactor = 10000 / areaM2;

    return {
        stemDensityHa: trees.length * haFactor,
        basalAreaHa: totalBa * haFactor,
        agbHa: (totalAgb / 1000) * haFactor,
        carbonHa: (totalAgb / 1000) * settings.carbonFraction * haFactor,
        qmd: calcQMD(gbhList),
        loreysHeight: calcLoreysHeight(trees),
        giniCoeff: calcGini(gbhList),
        regenerationCount: regenCount,
        diversity: {
            shannon: trees.length >= 10 ? calculateShannonIndex(Object.values(speciesCount)) : null,
            simpson: trees.length >= 10 ? calculateSimpsonIndex(Object.values(speciesCount)) : null,
            richness: Object.keys(speciesCount).length
        },
        isEstimate: (estimatedAgbCount / Math.max(1, gbhList.length)) > 0.5
    };
};
