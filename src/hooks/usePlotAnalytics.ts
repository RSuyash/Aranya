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

    const settings = module?.analysisSettings || DEFAULT_SETTINGS;

    // 2. Calculate Plot-Level Stats
    const plotStats = useMemo(() => {
        if (!plot) return null;

        let areaM2 = 400; // Default fallback

        // [FIX] Calculate true plot area from configuration if possible
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

        return calcStandStructure(trees, areaM2, settings);
    }, [plot, trees, settings]);

    // 3. Calculate Unit-Level Stats
    const unitStats = useMemo(() => {
        if (!plot || !selectedUnitId) return null;

        // [FIX] Resolve Geometry to get Exact Area
        let rootNode: PlotNodeInstance | null = null;

        if (plot.configuration) {
            rootNode = generateDynamicLayout(plot.configuration, plot.id);
        } else if (plot.blueprintId) {
            const bp = BlueprintRegistry.get(plot.blueprintId);
            if (bp) rootNode = generateLayout(bp, undefined, plot.id);
        }

        let unitAreaM2 = 100; // Safe fallback

        if (rootNode) {
            // Recursive search for the specific node
            const findNode = (node: PlotNodeInstance): PlotNodeInstance | null => {
                if (node.id === selectedUnitId) return node;
                for (const child of node.children) {
                    const found = findNode(child);
                    if (found) return found;
                }
                return null;
            };

            const unitNode = findNode(rootNode);

            if (unitNode) {
                if (unitNode.shape.kind === 'RECTANGLE') {
                    unitAreaM2 = unitNode.shape.width * unitNode.shape.length;
                } else if (unitNode.shape.kind === 'CIRCLE') {
                    unitAreaM2 = Math.PI * Math.pow(unitNode.shape.radius, 2);
                } else if (unitNode.shape.kind === 'POINT') {
                    // Point sampling usually assumes a minimal area or is dimensionless
                    // For density calcs, we often treat it as a small radius
                    unitAreaM2 = Math.PI * Math.pow(unitNode.shape.radius || 1, 2);
                }
            }
        }

        const unitTrees = overrideUnitTrees || trees.filter(t => t.samplingUnitId === selectedUnitId);

        return calcStandStructure(unitTrees, unitAreaM2, settings);

    }, [plot, trees, selectedUnitId, settings, overrideUnitTrees]);

    // 4. Compare
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
