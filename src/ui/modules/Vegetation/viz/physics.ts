import type { TreeObservation } from '../../../../core/data-model/types';
import type { UnitVizNode, TreeVizNode } from './buildPlotVizModel';
import type { PlotConfiguration } from '../../../../core/plot-engine/types';

// --- MATH UTILS ---

/**
 * Deterministic RNG (Mulberry32).
 * Guarantees that unmapped trees appear in the same spot every time for a given Unit ID.
 */
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

// --- SPATIAL INDEX (For Collision Detection of Unmapped Trees) ---
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

    // --- 1. Separate Fixed vs Floating Trees ---
    const fixedTrees: TreeObservation[] = [];
    const floatingTrees: TreeObservation[] = [];

    trees.forEach(t => {
        // Strict check: 0 is a valid coordinate
        const hasCoords = t.localX !== undefined && t.localY !== undefined && t.localX !== null && t.localY !== null;
        if (hasCoords) {
            fixedTrees.push(t);
        } else {
            floatingTrees.push(t);
        }
    });

    // Helper: Logarithmic radius scaling for visuals
    const getRadius = (gbh: number = 50) => Math.max(4, 3 + Math.log(Math.max(1, gbh)) * 2.5);

    // --- 2. Place FIXED Trees (Absolute Priority) ---
    // These ignore collision logic because the user explicitly placed them there.
    fixedTrees.forEach(tree => {
        const unit = units.find(u => u.id === tree.samplingUnitId);
        if (!unit) return;

        // Coordinate System: Cartesian (Bottom-Left) -> Screen (Top-Left)
        // Y = UnitTop + (UnitHeight - (TreeY * Scale))
        const unitHeightPx = unit.screenHeight;
        const x = unit.screenX + (tree.localX! * scale);
        const y = unit.screenY + (unitHeightPx - (tree.localY! * scale));

        const radius = getRadius(tree.gbh);

        nodes.push({
            id: tree.id,
            unitId: tree.samplingUnitId,
            speciesName: tree.speciesName,
            gbh: tree.gbh,
            screenX: x,
            screenY: y,
            radius,
        });

        // Register in index so floating trees avoid them
        spatialIndex.insert(x, y, radius);
    });

    // --- 3. Place FLOATING Trees (Physics / "Best Candidate" Algo) ---
    // Group by unit so they spawn inside their container
    const floatingByUnit = new Map<string, TreeObservation[]>();
    floatingTrees.forEach(t => {
        if (!floatingByUnit.has(t.samplingUnitId)) floatingByUnit.set(t.samplingUnitId, []);
        floatingByUnit.get(t.samplingUnitId)!.push(t);
    });

    floatingByUnit.forEach((unitTrees, unitId) => {
        const unit = units.find(u => u.id === unitId);
        if (!unit) return;

        const rng = createRandom(hashString(unitId));

        // Define exclusion zones (Subplots that forbid canopy)
        const exclusions = units.filter(u =>
            u.role === 'SUBPLOT' && u.excludesCanopy &&
            // Simple overlap check
            u.screenX >= unit.screenX && u.screenX < unit.screenX + unit.screenWidth
        );

        unitTrees.forEach(tree => {
            const radius = getRadius(tree.gbh);
            const margin = radius + 4; // Keep away from edges

            let bestX = 0, bestY = 0, maxDist = -1;
            let found = false;

            // Attempt 12 positions, pick the one with best separation
            for (let i = 0; i < 12; i++) {
                const cx = unit.screenX + margin + (rng() * (unit.screenWidth - 2 * margin));
                const cy = unit.screenY + margin + (rng() * (unit.screenHeight - 2 * margin));

                // A. Check Exclusions
                const inExclusion = exclusions.some(ex =>
                    cx >= ex.screenX && cx <= ex.screenX + ex.screenWidth &&
                    cy >= ex.screenY && cy <= ex.screenY + ex.screenHeight
                );
                if (inExclusion) continue;

                // B. Check Neighbors (Spatial Hash)
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

            // Fallback: If map is full, center it or use last guess
            if (!found) {
                bestX = unit.screenX + unit.screenWidth / 2;
                bestY = unit.screenY + unit.screenHeight / 2;
            }

            nodes.push({
                id: tree.id,
                unitId: tree.samplingUnitId,
                speciesName: tree.speciesName,
                gbh: tree.gbh,
                screenX: bestX,
                screenY: bestY,
                radius,
            });

            spatialIndex.insert(bestX, bestY, radius);
        });
    });

    // 4. Depth Sorting (Y-Sort) for 2.5D visual stacking
    return nodes.sort((a, b) => a.screenY - b.screenY);
}