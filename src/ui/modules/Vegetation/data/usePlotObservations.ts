import { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../../../core/data-model/dexie';

// Natural sort for tags (T-1, T-2, T-10... instead of T-1, T-10, T-2)
const naturalSort = (a: string, b: string) => {
    return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
};

export function usePlotObservations(plotId: string) {
    // 1. Live Queries
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

    // 2. Memoized Transformations

    // Sorted Trees
    const sortedTrees = useMemo(() => {
        return [...trees].sort((a, b) => naturalSort(a.tagNumber, b.tagNumber));
    }, [trees]);

    // Aggregates
    const stats = useMemo(() => ({
        treeCount: trees.length,
        vegCount: veg.length,
        unitsCompleted: progress.filter(u => u.status === 'DONE').length,
        unitsTotal: progress.length,
        lastActivity: Math.max(
            ...trees.map(t => t.updatedAt),
            ...veg.map(v => v.updatedAt),
            0
        )
    }), [trees, veg, progress]);

    return {
        // Data
        trees: sortedTrees, // <--- Now Sorted!
        veg,
        progress,

        // Meta
        stats, // <--- New: Instant counts
        isEmpty: trees.length === 0 && veg.length === 0,
        isLoading: false // Dexie returns empty arrays initially, so loading is implicit
    };
}