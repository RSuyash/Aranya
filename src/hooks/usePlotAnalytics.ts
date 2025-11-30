import { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../core/data-model/dexie';
import { calcStandStructure, DEFAULT_SETTINGS } from '../analysis/biometrics';
import type { Plot, TreeObservation, VegetationModule } from '../core/data-model/types';
// [NEW] Import Layout Engine
import { generateLayout } from '../core/plot-engine/generateLayout';
import { generateDynamicLayout } from '../core/plot-engine/dynamicGenerator';
import { BlueprintRegistry } from '../core/plot-engine/blueprints';
import type { PlotNodeInstance } from '../core/plot-engine/types';

export const usePlotAnalytics = (
    plot: Plot | undefined,
    trees: TreeObservation[],
    selectedUnitId: string | null,
    overrideUnitTrees?: TreeObservation[]
) => {
    // 1. Fetch Configuration
    const module = useLiveQuery(
        () => plot ? db.modules.get(plot.moduleId) as Promise<VegetationModule> : undefined,
        [plot?.moduleId]
    );

    // [THORNE FIX] 1. Fetch Progress to determine true "Effort"
    const progress = useLiveQuery(
        () => plot ? db.samplingUnits.where('plotId').equals(plot.id).toArray() : [],
        [plot?.id]
    ) || [];

    const settings = module?.analysisSettings || DEFAULT_SETTINGS;

    // 2. Resolve Layout (Common for both)
    const rootNode = useMemo(() => {
        if (!plot) return null;
        if (plot.configuration) {
            return generateDynamicLayout(plot.configuration, plot.id);
        } else if (plot.blueprintId) {
            const bp = BlueprintRegistry.get(plot.blueprintId);
            if (bp) return generateLayout(bp, undefined, plot.id);
        }
        return null;
    }, [plot]);

    // Helper to find node area
    const getNodeArea = (node: PlotNodeInstance | null, targetId: string): number | null => {
        if (!node) return null;
        if (node.id === targetId) {
            if (node.shape.kind === 'RECTANGLE') return node.shape.width * node.shape.length;
            if (node.shape.kind === 'CIRCLE') return Math.PI * Math.pow(node.shape.radius, 2);
            if (node.shape.kind === 'POINT') return Math.PI * Math.pow(node.shape.radius || 1, 2);
            return null;
        }
        for (const child of node.children) {
            const area = getNodeArea(child, targetId);
            if (area !== null) return area;
        }
        return null;
    };

    // 3. Calculate Plot-Level Stats
    const plotStats = useMemo(() => {
        if (!plot) return null;

        let areaM2 = 400; // Default fallback

        // Calculate total plot area first (as fallback)
        if (plot.configuration) {
            const { width, length, radius } = plot.configuration.dimensions;
            if (plot.configuration.shape === 'CIRCLE') {
                areaM2 = Math.PI * Math.pow(radius || 0, 2);
            } else {
                areaM2 = width * length;
            }
        } else if (plot.customAttributes?.areaM2) {
            areaM2 = Number(plot.customAttributes.areaM2);
        }

        // [FIX] Calculate "Surveyed Area" based on units that have trees OR are marked DONE
        // This prevents "Unit vs Plot" from showing huge diffs when only 1 unit is done
        // AND fixes "Survivorship Bias" where empty units were ignored
        if (rootNode) {
            const finishedUnitIds = new Set([
                ...progress.filter(p => p.status === 'DONE').map(p => p.samplingUnitId),
                ...trees.map(t => t.samplingUnitId).filter(Boolean)
            ]);

            if (finishedUnitIds.size > 0) {
                let surveyedArea = 0;
                finishedUnitIds.forEach(uid => {
                    const uArea = getNodeArea(rootNode, uid as string);
                    if (uArea) surveyedArea += uArea;
                });

                // Only override if we have valid partial data
                if (surveyedArea > 0) {
                    areaM2 = surveyedArea;
                }
            }
        }

        return calcStandStructure(trees, areaM2, settings);
    }, [plot, trees, settings, rootNode, progress]);

    // 4. Calculate Unit-Level Stats
    const unitStats = useMemo(() => {
        if (!plot || !selectedUnitId) return null;

        let unitAreaM2 = 100; // Safe fallback

        if (rootNode) {
            const foundArea = getNodeArea(rootNode, selectedUnitId);
            if (foundArea) unitAreaM2 = foundArea;
        }

        const unitTrees = overrideUnitTrees || trees.filter(t => t.samplingUnitId === selectedUnitId);

        return calcStandStructure(unitTrees, unitAreaM2, settings);

    }, [plot, trees, selectedUnitId, settings, overrideUnitTrees, rootNode]);

    // 5. Compare
    const comparison = useMemo(() => {
        if (!plotStats || !unitStats) return null;
        const getPct = (u: number, p: number) => p === 0 ? 0 : ((u - p) / p) * 100;

        return {
            baDiff: getPct(unitStats.basalAreaHa, plotStats.basalAreaHa),
            carbonDiff: getPct(unitStats.carbonHa, plotStats.carbonHa),
            qmdDiff: getPct(unitStats.qmd, plotStats.qmd),
            densityDiff: getPct(unitStats.stemDensityHa, plotStats.stemDensityHa)
        };
    }, [plotStats, unitStats]);

    return { plotStats, unitStats, comparison, settings };
};
