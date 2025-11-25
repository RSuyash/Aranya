import type { PlotNodeInstance } from '../../../../core/plot-engine/types';
import type { TreeObservation, VegetationObservation, SamplingUnitProgress } from '../../../../core/data-model/types';
import { positionTrees } from './physics';

export interface UnitVizNode {
    id: string;
    label: string;
    role?: string;
    type: 'CONTAINER' | 'SAMPLING_UNIT';

    // Screen coordinates
    screenX: number;
    screenY: number;
    screenWidth: number;
    screenHeight: number;

    // Style
    fillColor: string;
    strokeColor: string;
    strokeWidth: number;
    zIndex: number;

    // Data
    status: 'NOT_STARTED' | 'IN_PROGRESS' | 'DONE';
    treeCount: number;
    vegCount: number;
}

export interface TreeVizNode {
    id: string;
    unitId: string;
    speciesName: string;
    gbh?: number;

    screenX: number;
    screenY: number;
    radius: number;
}

export interface PlotVizModel {
    units: UnitVizNode[];
    trees: TreeVizNode[];
    scale: number;
    bounds: {
        minX: number;
        minY: number;
        maxX: number;
        maxY: number;
    };
}

interface BuildVizModelArgs {
    rootInstance: PlotNodeInstance;
    trees: TreeObservation[];
    veg: VegetationObservation[];
    progress: SamplingUnitProgress[];
    viewportWidth: number;
    viewportHeight: number;
}

function getNodeDimensions(node: PlotNodeInstance): { width: number; height: number } {
    const shape = node.shape;
    switch (shape.kind) {
        case 'RECTANGLE':
            return { width: shape.width, height: shape.length };
        case 'CIRCLE':
            return { width: shape.radius * 2, height: shape.radius * 2 };
        case 'LINE':
            return { width: shape.length, height: shape.width ?? 0.1 };
        case 'POINT':
            const r = shape.radius ?? 0.1;
            return { width: r * 2, height: r * 2 };
    }
}

function collectAllNodes(root: PlotNodeInstance): PlotNodeInstance[] {
    const nodes: PlotNodeInstance[] = [root];
    for (const child of root.children) {
        nodes.push(...collectAllNodes(child));
    }
    return nodes;
}

function computeBounds(nodes: PlotNodeInstance[]) {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    for (const node of nodes) {
        const { width, height } = getNodeDimensions(node);
        minX = Math.min(minX, node.x);
        minY = Math.min(minY, node.y);
        maxX = Math.max(maxX, node.x + width);
        maxY = Math.max(maxY, node.y + height);
    }

    return { minX, minY, maxX, maxY };
}

function getStatusColor(status: 'NOT_STARTED' | 'IN_PROGRESS' | 'DONE'): { fill: string; stroke: string } {
    switch (status) {
        case 'DONE':
            return { fill: 'rgba(82, 210, 115, 0.15)', stroke: '#52d273' };
        case 'IN_PROGRESS':
            return { fill: 'rgba(86, 204, 242, 0.15)', stroke: '#56ccf2' };
        default:
            return { fill: 'rgba(155, 162, 192, 0.08)', stroke: '#555b75' };
    }
}

export function buildPlotVizModel({
    rootInstance,
    trees,
    veg,
    progress,
    viewportWidth,
    viewportHeight,
}: BuildVizModelArgs): PlotVizModel {
    const padding = 16;
    const allNodes = collectAllNodes(rootInstance);
    const bounds = computeBounds(allNodes);

    // Compute scale to fit viewport
    const plotWidthMeters = bounds.maxX - bounds.minX;
    const plotHeightMeters = bounds.maxY - bounds.minY;

    const scaleX = (viewportWidth - 2 * padding) / plotWidthMeters;
    const scaleY = (viewportHeight - 2 * padding) / plotHeightMeters;
    const scale = Math.min(scaleX, scaleY);

    // Build progress map
    const progressMap = new Map<string, 'NOT_STARTED' | 'IN_PROGRESS' | 'DONE'>();
    progress.forEach(p => progressMap.set(p.samplingUnitId, p.status));

    // Build tree count map
    const treeCountMap = new Map<string, number>();
    trees.forEach(t => {
        treeCountMap.set(t.samplingUnitId, (treeCountMap.get(t.samplingUnitId) || 0) + 1);
    });

    // Build veg count map
    const vegCountMap = new Map<string, number>();
    veg.forEach(v => {
        vegCountMap.set(v.samplingUnitId, (vegCountMap.get(v.samplingUnitId) || 0) + 1);
    });

    // Map nodes to viz units
    const units: UnitVizNode[] = allNodes.map(node => {
        const { width, height } = getNodeDimensions(node);
        const screenX = padding + (node.x - bounds.minX) * scale;
        const screenY = padding + (node.y - bounds.minY) * scale;
        const screenWidth = width * scale;
        const screenHeight = height * scale;

        const status = progressMap.get(node.id) || 'NOT_STARTED';
        const colors = getStatusColor(status);

        // Determine z-index based on role and type
        let zIndex = 0;
        if (node.role === 'MAIN_PLOT') zIndex = 0;
        else if (node.type === 'SAMPLING_UNIT' && !node.role) zIndex = 1;
        else if (node.role === 'SUBPLOT') zIndex = 2;

        return {
            id: node.id,
            label: node.label,
            role: node.role,
            type: node.type,
            screenX,
            screenY,
            screenWidth,
            screenHeight,
            fillColor: colors.fill,
            strokeColor: colors.stroke,
            strokeWidth: node.role === 'SUBPLOT' ? 2 : 1,
            zIndex,
            status,
            treeCount: treeCountMap.get(node.id) || 0,
            vegCount: vegCountMap.get(node.id) || 0,
        };
    });

    // Position trees using physics
    const treeVizNodes = positionTrees({
        trees,
        units,
        scale,
        bounds,
        padding,
    });

    return {
        units,
        trees: treeVizNodes,
        scale,
        bounds,
    };
}
