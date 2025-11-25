import type { TreeObservation } from '../../../../core/data-model/types';
import type { UnitVizNode, TreeVizNode } from './buildPlotVizModel';
import type { PlotConfiguration } from '../../../../core/plot-engine/types';

interface PositionTreesArgs {
    trees: TreeObservation[];
    units: UnitVizNode[];
    scale: number;
    bounds: { minX: number; minY: number; maxX: number; maxY: number };
    padding: number;
    config?: PlotConfiguration;
}

function isPointInRect(x: number, y: number, rect: { screenX: number; screenY: number; screenWidth: number; screenHeight: number }): boolean {
    return x >= rect.screenX && x <= rect.screenX + rect.screenWidth &&
        y >= rect.screenY && y <= rect.screenY + rect.screenHeight;
}

export function positionTrees({
    trees,
    units,
    scale,
    bounds,
    padding,
    config,
}: PositionTreesArgs): TreeVizNode[] {
    if (trees.length === 0) return [];

    // Group trees by unit
    const treesByUnit = new Map<string, TreeObservation[]>();
    trees.forEach(tree => {
        if (!treesByUnit.has(tree.samplingUnitId)) {
            treesByUnit.set(tree.samplingUnitId, []);
        }
        treesByUnit.get(tree.samplingUnitId)!.push(tree);
    });

    const allTreeNodes: TreeVizNode[] = [];
    const minInterTreeDistanceMeters = config?.rules?.minInterTreeDistance || 0.5;
    const minInterTreeDistancePixels = minInterTreeDistanceMeters * scale;

    // Process each unit's trees
    treesByUnit.forEach((unitTrees, unitId) => {
        const unit = units.find(u => u.id === unitId);
        if (!unit || unit.type !== 'SAMPLING_UNIT') return;

        // Find subplots that exclude canopy
        const exclusionZones = units.filter(u =>
            u.role === 'SUBPLOT' &&
            u.excludesCanopy &&
            u.screenX >= unit.screenX && u.screenX < unit.screenX + unit.screenWidth &&
            u.screenY >= unit.screenY && u.screenY < unit.screenY + unit.screenHeight
        );

        // Position each tree using Rejection Sampling
        unitTrees.forEach(tree => {
            // 1. CHECK FOR EXPLICIT COORDINATES (The Fix)
            if (tree.localX !== undefined && tree.localY !== undefined) {
                // Convert Cartesian Local (Bottom-Left origin) to Screen SVG (Top-Left origin)
                const unitHeightMeters = unit.screenHeight / scale;

                const x = unit.screenX + (tree.localX * scale);
                const y = unit.screenY + ((unitHeightMeters - tree.localY) * scale);

                // GBH to visual radius (30-100cm → 4-10px)
                const gbh = tree.gbh || 50;
                const radius = Math.max(4, Math.min(10, gbh / 10));

                allTreeNodes.push({
                    id: tree.id,
                    unitId: tree.samplingUnitId,
                    speciesName: tree.speciesName,
                    gbh: tree.gbh,
                    screenX: x,
                    screenY: y,
                    radius: radius,
                });
                return; // Skip random generation for this tree
            }

            // Seed for deterministic randomness
            const seed = tree.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
            let rng = seed;
            const random = () => {
                const x = Math.sin(rng++) * 10000;
                return x - Math.floor(x);
            };

            // GBH to visual radius (30-100cm → 4-10px)
            const gbh = tree.gbh || 50;
            const radius = Math.max(4, Math.min(10, gbh / 10));
            const margin = radius; // Minimal margin to keep circle inside

            let valid = false;
            let attempts = 0;
            let x = 0;
            let y = 0;

            while (!valid && attempts < 100) {
                // Generate candidate position within unit
                const rx = random();
                const ry = random();
                x = unit.screenX + margin + rx * (unit.screenWidth - 2 * margin);
                y = unit.screenY + margin + ry * (unit.screenHeight - 2 * margin);

                valid = true;

                // 1. Check Tree-to-Tree Collision
                // Check against already placed trees in this unit (and potentially others if we wanted global collision)
                // For now, checking against all placed trees to ensure global consistency
                for (const other of allTreeNodes) {
                    const dx = x - other.screenX;
                    const dy = y - other.screenY;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    const minDist = radius + other.radius + minInterTreeDistancePixels; // Physical distance + visual radii

                    if (dist < minDist) {
                        valid = false;
                        break;
                    }
                }

                if (!valid) {
                    attempts++;
                    continue;
                }

                // 2. Check Subplot Exclusion
                for (const zone of exclusionZones) {
                    if (isPointInRect(x, y, zone)) {
                        valid = false;
                        break;
                    }
                }

                if (!valid) attempts++;
            }

            // If failed to find valid position after 100 attempts, place it anyway (fallback)
            // usually at the last candidate position or center if completely failed
            if (!valid && attempts >= 100) {
                console.warn(`Could not find valid position for tree ${tree.id} after 100 attempts`);
            }

            allTreeNodes.push({
                id: tree.id,
                unitId: tree.samplingUnitId,
                speciesName: tree.speciesName,
                gbh: tree.gbh,
                screenX: x,
                screenY: y,
                radius: radius,
            });
        });
    });

    return allTreeNodes;
}
