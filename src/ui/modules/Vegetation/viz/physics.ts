import type { TreeObservation } from '../../../../core/data-model/types';
import type { UnitVizNode, TreeVizNode } from './buildPlotVizModel';
import type { PlotConfiguration } from '../../../../core/plot-engine/types';

// --- MATH UTILS ---

const createRandom = (seed: number) => {
    return () => {
        let t = (seed += 0x6D2B79F5);
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
};

const hashString = (str: string): number => {
    let hash = 2166136261;
    for (let i = 0; i < str.length; i++) {
        hash ^= str.charCodeAt(i);
        hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
};

// --- SPATIAL INDEX ---
class SpatialHash {
    private grid: Map<string, { x: number; y: number; r: number }[]> = new Map();
    private cellSize: number;

    constructor(cellSize: number) {
        this.cellSize = cellSize;
    }

    insert(x: number, y: number, r: number) {
        const k = `${Math.floor(x / this.cellSize)},${Math.floor(y / this.cellSize)}`;
        if (!this.grid.has(k)) this.grid.set(k, []);
        this.grid.get(k)!.push({ x, y, r });
    }

    query(x: number, y: number, range: number) {
        const results: { x: number; y: number; r: number }[] = [];
        const startX = Math.floor((x - range) / this.cellSize);
        const endX = Math.floor((x + range) / this.cellSize);
        const startY = Math.floor((y - range) / this.cellSize);
        const endY = Math.floor((y + range) / this.cellSize);

        for (let cx = startX; cx <= endX; cx++) {
            for (let cy = startY; cy <= endY; cy++) {
                const cell = this.grid.get(`${cx},${cy}`);
                if (cell) results.push(...cell);
            }
        }
        return results;
    }
}

interface PositionTreesArgs {
    trees: TreeObservation[];
    units: UnitVizNode[];
    scale: number;
    config?: PlotConfiguration;
}

export function positionTrees({
    trees,
    units,
    scale,
    config,
}: PositionTreesArgs): TreeVizNode[] {
    if (trees.length === 0) return [];

    const nodes: TreeVizNode[] = [];
    const minTreeDistPx = (config?.rules?.minInterTreeDistance || 0.5) * scale;
    const spatialIndex = new SpatialHash(100);

    const fixedTrees: TreeObservation[] = [];
    const floatingTrees: TreeObservation[] = [];

    trees.forEach(t => {
        const hasCoords = t.localX !== undefined && t.localY !== undefined && t.localX !== null && t.localY !== null;
        if (hasCoords) {
            fixedTrees.push(t);
        } else {
            floatingTrees.push(t);
        }
    });

    const getRadius = (gbh: number = 50) => Math.max(2.5, Math.sqrt(Math.max(0, gbh)) * 0.8);
    const clamp = (val: number, min: number, max: number) => Math.min(Math.max(val, min), max);

    // --- Place FIXED Trees ---
    fixedTrees.forEach(tree => {
        const unit = units.find(u => u.id === tree.samplingUnitId);
        if (!unit) return;

        const radius = getRadius(tree.gbh);
        const unitHeightPx = unit.screenHeight;
        let x = unit.screenX + (tree.localX! * scale);
        let y = unit.screenY + (unitHeightPx - (tree.localY! * scale));

        const minX = unit.screenX + radius;
        const maxX = unit.screenX + unit.screenWidth - radius;
        const minY = unit.screenY + radius;
        const maxY = unit.screenY + unit.screenHeight - radius;

        x = clamp(x, minX, maxX);
        y = clamp(y, minY, maxY);

        nodes.push({
            id: tree.id,
            unitId: tree.samplingUnitId,
            speciesName: tree.speciesName,
            gbh: tree.gbh,
            condition: tree.condition, // [Vance Added] Passthrough
            screenX: x,
            screenY: y,
            radius,
        });

        spatialIndex.insert(x, y, radius);
    });

    // --- Place FLOATING Trees ---
    const floatingByUnit = new Map<string, TreeObservation[]>();
    floatingTrees.forEach(t => {
        if (!floatingByUnit.has(t.samplingUnitId)) floatingByUnit.set(t.samplingUnitId, []);
        floatingByUnit.get(t.samplingUnitId)!.push(t);
    });

    floatingByUnit.forEach((unitTrees, unitId) => {
        const unit = units.find(u => u.id === unitId);
        if (!unit) return;

        const rng = createRandom(hashString(unitId));
        const exclusions = units.filter(u =>
            u.role === 'SUBPLOT' && u.excludesCanopy &&
            u.screenX >= unit.screenX && u.screenX < unit.screenX + unit.screenWidth
        );

        unitTrees.forEach(tree => {
            const radius = getRadius(tree.gbh);
            const margin = radius + 2;

            let bestX = 0, bestY = 0, maxDist = -1;
            let found = false;

            for (let i = 0; i < 12; i++) {
                const availableW = Math.max(0, unit.screenWidth - 2 * margin);
                const availableH = Math.max(0, unit.screenHeight - 2 * margin);

                const cx = unit.screenX + margin + (rng() * availableW);
                const cy = unit.screenY + margin + (rng() * availableH);

                const inExclusion = exclusions.some(ex =>
                    cx >= ex.screenX && cx <= ex.screenX + ex.screenWidth &&
                    cy >= ex.screenY && cy <= ex.screenY + ex.screenHeight
                );
                if (inExclusion) continue;

                const neighbors = spatialIndex.query(cx, cy, minTreeDistPx * 4);
                let closest = Infinity;

                for (const n of neighbors) {
                    const d = Math.sqrt(Math.pow(cx - n.x, 2) + Math.pow(cy - n.y, 2)) - n.r - radius;
                    if (d < closest) closest = d;
                }

                if (closest > maxDist) {
                    maxDist = closest;
                    bestX = cx;
                    bestY = cy;
                    found = true;
                }
            }

            if (!found) {
                bestX = unit.screenX + unit.screenWidth / 2;
                bestY = unit.screenY + unit.screenHeight / 2;
            }

            nodes.push({
                id: tree.id,
                unitId: tree.samplingUnitId,
                speciesName: tree.speciesName,
                gbh: tree.gbh,
                condition: tree.condition, // [Vance Added] Passthrough
                screenX: bestX,
                screenY: bestY,
                radius,
            });

            spatialIndex.insert(bestX, bestY, radius);
        });
    });

    return nodes.sort((a, b) => a.screenY - b.screenY);
}