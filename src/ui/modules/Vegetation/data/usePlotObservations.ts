import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../../../core/data-model/dexie';

export function usePlotObservations(plotId: string) {
    const trees = useLiveQuery(
        () => db.treeObservations.where('plotId').equals(plotId).toArray(),
        [plotId]
    ) || [];

    const veg = useLiveQuery(
        () => db.vegetationObservations.where('plotId').equals(plotId).toArray(),
        [plotId]
    ) || [];

    const progress = useLiveQuery(
        () => db.samplingUnits.where('plotId').equals(plotId).toArray(),
        [plotId]
    ) || [];

    return {
        trees,
        veg,
        progress,
        isLoading: false // Data can be empty arrays
    };
}
