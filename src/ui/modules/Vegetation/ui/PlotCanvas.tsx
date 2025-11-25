import React, { useMemo } from 'react';
import { usePlotData } from '../data/usePlotData';
import { usePlotObservations } from '../data/usePlotObservations';
import { generateLayout } from '../../../../core/plot-engine/generateLayout';
import { generateDynamicLayout } from '../../../../core/plot-engine/dynamicGenerator';
import { buildPlotVizModel } from '../viz/buildPlotVizModel';
import { UnitsLayer } from './layers/UnitsLayer';
import { TreesLayer } from './layers/TreesLayer';
import { LabelsLayer } from './layers/LabelsLayer';
import type { PlotVisualizationSettings } from '../../../../core/data-model/types';

interface PlotCanvasProps {
    plotId: string;
    viewportWidth: number;
    viewportHeight: number;
    selectedUnitId?: string;
    onSelectUnit?: (unitId: string) => void;
    digitizationMode?: boolean;
    onDigitizeTree?: (unitId: string, x: number, y: number) => void;
    visualizationSettings?: PlotVisualizationSettings;
}

export const PlotCanvas: React.FC<PlotCanvasProps> = ({
    plotId,
    viewportWidth,
    viewportHeight,
    selectedUnitId,
    onSelectUnit,
    visualizationSettings,
    digitizationMode = false,
    onDigitizeTree,
}) => {
    const { plot, blueprint, isLoading: dataLoading } = usePlotData(plotId);
    const { trees, veg, progress } = usePlotObservations(plotId);
    const [mousePos, setMousePos] = React.useState<{ x: number, y: number } | null>(null);

    const rootInstance = useMemo(() => {
        if (!plot) return null;
        if (plot.blueprintId === 'dynamic' && plot.configuration) {
            return generateDynamicLayout(plot.configuration, plotId);
        }
        if (blueprint) {
            return generateLayout(blueprint, undefined, plotId);
        }
        return null;
    }, [blueprint, plot, plotId]);

    const vizModel = useMemo(() => {
        if (!rootInstance || viewportWidth === 0 || viewportHeight === 0) {
            return null;
        }

        return buildPlotVizModel({
            rootInstance,
            trees,
            veg,
            progress,
            viewportWidth,
            viewportHeight,
            visualizationSettings: {
                showQuadrants: visualizationSettings?.showQuadrants ?? true,
                showSubplots: visualizationSettings?.showSubplots ?? true,
                showQuadrantLines: visualizationSettings?.showQuadrantLines ?? true,
                showTreeVisualization: visualizationSettings?.showTreeVisualization ?? true,
                showLabels: visualizationSettings?.showLabels ?? true,
                subplotOpacity: visualizationSettings?.subplotOpacity ?? 0.2,
                plotConfiguration: plot?.configuration
            }
        });
    }, [rootInstance, trees, veg, progress, viewportWidth, viewportHeight, visualizationSettings, plot]);

    // Snap to Grid Logic (0.5m grid)
    const snappedPos = useMemo(() => {
        if (!mousePos || !vizModel || !plot?.configuration) return null;

        const mainPlot = vizModel.units.find(u => u.role === 'MAIN_PLOT');
        if (!mainPlot) return null;

        const scaleX = mainPlot.screenWidth / plot.configuration.dimensions.width;
        const scaleY = mainPlot.screenHeight / plot.configuration.dimensions.length;

        const relX = mousePos.x - mainPlot.screenX;
        const relY = mousePos.y - mainPlot.screenY;

        const metersX = relX / scaleX;
        const metersY = plot.configuration.dimensions.length - (relY / scaleY);

        const gridSize = 0.5;
        const snappedMetersX = Math.round(metersX / gridSize) * gridSize;
        const snappedMetersY = Math.round(metersY / gridSize) * gridSize;

        const clampedX = Math.max(0, Math.min(plot.configuration.dimensions.width, snappedMetersX));
        const clampedY = Math.max(0, Math.min(plot.configuration.dimensions.length, snappedMetersY));

        const screenX = mainPlot.screenX + (clampedX * scaleX);
        const screenY = mainPlot.screenY + ((plot.configuration.dimensions.length - clampedY) * scaleY);

        return { screenX, screenY, metersX: clampedX, metersY: clampedY };
    }, [mousePos, vizModel, plot]);

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!digitizationMode) return;
        const rect = e.currentTarget.getBoundingClientRect();
        setMousePos({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        });
    };

    // REFINED HIT TEST LOGIC
    const resolveSpatialContext = (
        node: typeof rootInstance,
        globalX: number,
        globalY: number
    ): { unitId: string; localX: number; localY: number } | null => {

        // Recursive search function
        const search = (current: typeof rootInstance, relX: number, relY: number): { unitId: string; localX: number; localY: number } | null => {
            if (!current) return null;

            // 1. Check Children First (Reverse order for Z-index correctness: Top first)
            // Subplots are usually last in children array, so we check them first.
            if (current.children) {
                for (let i = current.children.length - 1; i >= 0; i--) {
                    const child = current.children[i];

                    // Calculate child's bounds relative to current node
                    // Child.x / Child.y are offsets from current node's origin
                    const childX = child.x;
                    const childY = child.y;
                    const childW = child.shape.kind === 'RECTANGLE' ? child.shape.width : 0;
                    const childL = child.shape.kind === 'RECTANGLE' ? child.shape.length : 0;

                    // Check if point is inside child
                    if (relX >= childX && relX <= childX + childW && relY >= childY && relY <= childY + childL) {
                        // Point is inside this child. Recurse deeper.
                        // Pass coordinates relative to the child's origin
                        const result = search(child, relX - childX, relY - childY);
                        if (result) return result;
                    }
                }
            }

            // 2. If no children matched, check if THIS node is a valid sampling unit
            if (current.type === 'SAMPLING_UNIT') {
                return {
                    unitId: current.id,
                    localX: relX, // Already relative to this unit
                    localY: relY
                };
            }

            return null;
        };

        // Start search from root
        return search(node, globalX, globalY);
    };

    const handleClick = () => {
        if (digitizationMode && snappedPos && onDigitizeTree && rootInstance) {
            // 1. Resolve Context
            const context = resolveSpatialContext(rootInstance, snappedPos.metersX, snappedPos.metersY);

            if (context) {
                // 2. Pass resolved context to parent
                onDigitizeTree(context.unitId, context.localX, context.localY);
            } else {
                console.warn("Clicked outside valid sampling unit");
            }
        }
    };

    if (dataLoading || !vizModel) {
        return (
            <div className="w-full h-full flex items-center justify-center">
                <div className="text-[#9ba2c0]">Loading map...</div>
            </div>
        );
    }

    return (
        <div
            className={`relative w-full h-full bg-[#050814] ${digitizationMode ? 'cursor-crosshair' : ''}`}
            style={{ width: viewportWidth, height: viewportHeight }}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setMousePos(null)}
            onClick={handleClick}
        >
            {/* Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#0b1020] to-[#050814]" />

            {/* Layers */}
            <UnitsLayer
                units={vizModel.units}
                selectedUnitId={selectedUnitId}
                onSelectUnit={!digitizationMode ? onSelectUnit : undefined}
                showQuadrants={visualizationSettings?.showQuadrants}
                showSubplots={visualizationSettings?.showSubplots}
                showQuadrantLines={visualizationSettings?.showQuadrantLines}
            />
            <TreesLayer
                trees={vizModel.trees}
                visible={visualizationSettings?.showTreeVisualization}
            />
            <LabelsLayer
                units={vizModel.units}
                visible={visualizationSettings?.showLabels}
            />

            {/* Ghost Tree for Digitization */}
            {digitizationMode && snappedPos && (
                <div
                    className="absolute pointer-events-none flex flex-col items-center z-50"
                    style={{
                        left: snappedPos.screenX,
                        top: snappedPos.screenY,
                        transform: 'translate(-50%, -50%)'
                    }}
                >
                    <div className="w-4 h-4 rounded-full border-2 border-[#52d273] bg-[#52d273]/30 shadow-[0_0_10px_rgba(82,210,115,0.5)]" />

                    {/* Smart Label */}
                    <div className="mt-2 px-2 py-1 bg-[#0b1020]/95 border border-[#52d273]/50 rounded-md shadow-xl text-left">
                        <div className="text-[10px] text-[#9ba2c0] uppercase tracking-wider font-bold">
                            TARGET LOCATION
                        </div>
                        <div className="text-xs text-[#52d273] font-mono font-bold">
                            X: {snappedPos.metersX.toFixed(2)}m
                        </div>
                        <div className="text-xs text-[#52d273] font-mono font-bold">
                            Y: {snappedPos.metersY.toFixed(2)}m
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
