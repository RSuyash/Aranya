import type { TreeObservation } from '../../../../core/data-model/types';
import type { UnitVizNode, TreeVizNode } from './buildPlotVizModel';

interface PositionTreesArgs {
    trees: TreeObservation[];
    units: UnitVizNode[];
    scale: number;
    bounds: { minX: number; minY: number; maxX: number; maxY: number };
    padding: number;
}

interface TreePhysicsNode {
    id: string;
    x: number;
    y: number;
    baseX: number;
    baseY: number;
    radius: number;
    unitId: string;
}

function isPointInRect(x: number, y: number, rect: { screenX: number; screenY: number; screenWidth: number; screenHeight: number }): boolean {
    return x >= rect.screenX && x <= rect.screenX + rect.screenWidth &&
        y >= rect.screenY && y <= rect.screenY + rect.screenHeight;
}

function clampToRect(x: number, y: number, rect: { screenX: number; screenY: number; screenWidth: number; screenHeight: number; }, margin: number = 0) {
    return {
        x: Math.max(rect.screenX + margin, Math.min(x, rect.screenX + rect.screenWidth - margin)),
        y: Math.max(rect.screenY + margin, Math.min(y, rect.screenY + rect.screenHeight - margin)),
    };
}

export function positionTrees({
    trees,
    units,
    scale,
    bounds,
    padding,
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

    // Process each unit's trees
    treesByUnit.forEach((unitTrees, unitId) => {
        const unit = units.find(u => u.id === unitId);
        if (!unit || unit.type !== 'SAMPLING_UNIT') return;

        // Find subplots within this unit
        const subplots = units.filter(u => u.role === 'SUBPLOT' &&
            u.screenX >= unit.screenX && u.screenX < unit.screenX + unit.screenWidth &&
            u.screenY >= unit.screenY && u.screenY < unit.screenY + unit.screenHeight
        );

        // Initialize physics nodes for trees in this unit
        const physicsNodes: TreePhysicsNode[] = unitTrees.map((tree, idx) => {
            // Use tree ID as seed for deterministic positioning
            const seed = tree.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
            const random1 = Math.abs(Math.sin(seed * 12.9898) * 43758.5453 % 1);
            const random2 = Math.abs(Math.cos(seed * 78.233) * 43758.5453 % 1);

            // GBH to visual radius (30-100cm → 4-10px)
            const gbh = tree.gbh || 50;
            const radius = Math.max(4, Math.min(10, gbh / 10));

            // Initial position within unit (with margin for radius)
            const margin = radius + 2;
            const baseX = unit.screenX + margin + random1 * (unit.screenWidth - 2 * margin);
            const baseY = unit.screenY + margin + random2 * (unit.screenHeight - 2 * margin);

            return {
                id: tree.id,
                x: baseX,
                y: baseY,
                baseX,
                baseY,
                radius,
                unitId: tree.samplingUnitId,
            };
        });

        // Run physics simulation (20 iterations)
        for (let iter = 0; iter < 20; iter++) {
            // Repel overlapping trees
            for (let i = 0; i < physicsNodes.length; i++) {
                for (let j = i + 1; j < physicsNodes.length; j++) {
                    const a = physicsNodes[i];
                    const b = physicsNodes[j];

                    const dx = b.x - a.x;
                    const dy = b.y - a.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    const minDist = a.radius + b.radius + 4; // 4px padding

                    if (dist < minDist && dist > 0) {
                        const force = (minDist - dist) / dist * 0.5;
                        const fx = dx * force;
                        const fy = dy * force;

                        a.x -= fx;
                        a.y -= fy;
                        b.x += fx;
                        b.y += fy;
                    }
                }
            }

            // Push trees out of subplots
            physicsNodes.forEach(node => {
                subplots.forEach(subplot => {
                    if (isPointInRect(node.x, node.y, subplot)) {
                        // Push outward from subplot center
                        const subplotCenterX = subplot.screenX + subplot.screenWidth / 2;
                        const subplotCenterY = subplot.screenY + subplot.screenHeight / 2;
                        const dx = node.x - subplotCenterX;
                        const dy = node.y - subplotCenterY;
                        const dist = Math.sqrt(dx * dx + dy * dy);

                        if (dist > 0) {
                            // Move to edge of subplot + radius
                            const targetDist = Math.max(subplot.screenWidth, subplot.screenHeight) / 2 + node.radius + 4;
                            node.x = subplotCenterX + (dx / dist) * targetDist;
                            node.y = subplotCenterY + (dy / dist) * targetDist;
                        }
                    }
                });
            });

            // Spring back to base position (soft constraint)
            physicsNodes.forEach(node => {
                const dx = node.baseX - node.x;
                const dy = node.baseY - node.y;
                node.x += dx * 0.1;
                node.y += dy * 0.1;
            });

            // Clamp to unit bounds
            physicsNodes.forEach(node => {
                const clamped = clampToRect(node.x, node.y, unit, node.radius + 2);
                node.x = clamped.x;
                node.y = clamped.y;
            });
        }

        // Convert to viz nodes
        physicsNodes.forEach(node => {
            const tree = unitTrees.find(t => t.id === node.id)!;
            allTreeNodes.push({
                id: node.id,
                unitId: node.unitId,
                speciesName: tree.speciesName,
                gbh: tree.gbh,
                screenX: node.x,
                screenY: node.y,
                radius: node.radius,
            });
        });
    });

    return allTreeNodes;
}
