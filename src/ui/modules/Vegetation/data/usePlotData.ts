import { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../../../core/data-model/dexie';
import { BlueprintRegistry } from '../../../../core/plot-engine/blueprints';
import { generateLayout } from '../../../../core/plot-engine/generateLayout';
import { generateDynamicLayout } from '../../../../core/plot-engine/dynamicGenerator';
import type { PlotVisualizationSettings } from '../../../../core/data-model/types';

export function usePlotData(plotId: string) {
    // 1. Fetch Core Entities
    const plot = useLiveQuery(() => db.plots.get(plotId), [plotId]);

    const module = useLiveQuery(
        () => plot ? db.modules.get(plot.moduleId) : undefined,
        [plot?.moduleId]
    );

    const project = useLiveQuery(
        () => plot ? db.projects.get(plot.projectId) : undefined,
        [plot?.projectId]
    );

    // 2. Resolve Layout Engine
    const blueprint = plot ? BlueprintRegistry.get(plot.blueprintId) : undefined;
    const isDynamic = plot?.blueprintId === 'dynamic';

    // 3. Compute Layout (The "Graph")
    // We compute this here so UI components don't have to.
    const layout = useMemo(() => {
        if (!plot) return null;

        if (isDynamic && plot.configuration) {
            return generateDynamicLayout(plot.configuration, plot.id);
        }

        if (blueprint) {
            return generateLayout(blueprint, undefined, plot.id);
        }

        return null;
    }, [plot, blueprint, isDynamic]);

    // 4. Compute Unit Label Map
    // We compute this here so UI components don't have to.
    const unitLabelMap = useMemo(() => {
        if (!layout) return new Map<string, string>();
        const map = new Map<string, string>();
        const traverse = (node: any) => {
            map.set(node.id, node.label);
            node.children?.forEach(traverse);
        };
        traverse(layout);
        return map;
    }, [layout]);

    // 5. Actions
    const updateVisualizationSettings = async (settings: PlotVisualizationSettings) => {
        await db.plots.update(plotId, { visualizationSettings: settings });
    };

    // 6. Derived State
    const isLoading = !plot || (!blueprint && !isDynamic);
    const hasConfiguration = !!(isDynamic ? plot?.configuration : blueprint);

    return {
        // Entities
        plot,
        module,
        project,

        // Engine
        blueprint,
        layout, // <--- New: Pre-calculated layout tree
        unitLabelMap,

        // State
        isLoading,
        hasConfiguration,
        isDynamic,

        // Actions
        updateVisualizationSettings,
    };
}