import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../../../core/data-model/dexie';
import { BlueprintRegistry } from '../../../../core/plot-engine/blueprints';

export function usePlotData(plotId: string) {
    const plot = useLiveQuery(() => db.plots.get(plotId), [plotId]);

    const module = useLiveQuery(
        () => plot ? db.modules.get(plot.moduleId) : undefined,
        [plot?.moduleId]
    );

    const project = useLiveQuery(
        () => plot ? db.projects.get(plot.projectId) : undefined,
        [plot?.projectId]
    );

    const blueprint = plot ? BlueprintRegistry.get(plot.blueprintId) : undefined;

    return {
        plot,
        module,
        project,
        blueprint,
        isLoading: !plot || !blueprint
    };
}
