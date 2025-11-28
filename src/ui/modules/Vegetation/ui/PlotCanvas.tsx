import React, { useMemo, useState } from 'react';
import { usePlotData } from '../data/usePlotData';
import { usePlotObservations } from '../data/usePlotObservations';
import { generateLayout } from '../../../../core/plot-engine/generateLayout';
import { generateDynamicLayout } from '../../../../core/plot-engine/dynamicGenerator';
import { buildPlotVizModel } from '../viz/buildPlotVizModel';
import { EnvironmentLayer } from './layers/EnvironmentLayer';
import { BioMarker } from './layers/BioMarker';
import type { PlotVisualizationSettings } from '../../../../core/data-model/types';
import { clsx } from 'clsx';
import { Target } from 'lucide-react';

import { TelemetryHUD } from './TelemetryHUD';

interface PlotCanvasProps {
    plotId: string;
    viewportWidth: number;
    viewportHeight: number;
    selectedUnitId?: string;
    onSelectUnit?: (unitId: string) => void;
    digitizationMode?: boolean;
    onDigitizeTree?: (unitId: string, x: number, y: number) => void;
    visualizationSettings?: PlotVisualizationSettings;
    onEditTree?: (treeId: string) => void;
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
    onEditTree,
}) => {
    const { plot, blueprint, isLoading } = usePlotData(plotId);
    const { trees, veg, progress } = usePlotObservations(plotId);
    const [mousePos, setMousePos] = useState<{ x: number, y: number } | null>(null);

    // 1. Resolve Layout Engine
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

    // 2. Build Visualization Model
    // We pass NO filtering settings here. The model contains EVERYTHING.
    // Visibility is handled by the Layer components.
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
            // Pass settings for physics config (spacing rules) but NOT for filtering
            visualizationSettings: {
                ...visualizationSettings,
                showQuadrants: true,
                showSubplots: true,
                plotConfiguration: plot?.configuration
            } as any
        });
    }, [rootInstance, trees, veg, progress, viewportWidth, viewportHeight, visualizationSettings, plot]);

    // 3. Grid Snapping
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

        // Clamp
        const clampedX = Math.max(0, Math.min(plot.configuration.dimensions.width, metersX));
        const clampedY = Math.max(0, Math.min(plot.configuration.dimensions.length, metersY));

        const screenX = mainPlot.screenX + (clampedX * scaleX);
        const screenY = mainPlot.screenY + ((plot.configuration.dimensions.length - clampedY) * scaleY);

        return { screenX, screenY, metersX: clampedX, metersY: clampedY };
    }, [mousePos, vizModel, plot]);

    // 4. Hit Testing (for Digitization only)
    // The interactive clicks for selection are handled directly by the SVG elements in the layers
    // via pointer-events-auto. This hook is mainly for the "Digitization" reticle context.
    const resolveContext = () => {
        if (!snappedPos || !vizModel) return null;
        const units = vizModel.units.filter(u =>
            snappedPos.screenX >= u.screenX && snappedPos.screenX <= u.screenX + u.screenWidth &&
            snappedPos.screenY >= u.screenY && snappedPos.screenY <= u.screenY + u.screenHeight &&
            u.type === 'SAMPLING_UNIT'
        );
        units.sort((a, b) => b.zIndex - a.zIndex);
        const target = units[0];

        if (target) {
            const unitHeightMeters = target.screenHeight / vizModel.scale;
            const unitYTopScreen = target.screenY;
            const localYScreen = snappedPos.screenY - unitYTopScreen;
            const localYMeters = unitHeightMeters - (localYScreen / vizModel.scale);
            const localXMeters = (snappedPos.screenX - target.screenX) / vizModel.scale;

            return { unitId: target.id, label: target.label, localX: localXMeters, localY: localYMeters };
        }
        return null;
    };

    const hoveredContext = useMemo(resolveContext, [snappedPos, vizModel]);

    const handleMouseMove = (e: React.MouseEvent) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    };

    // Global click handler for digitization
    const handleClick = () => {
        if (digitizationMode && hoveredContext && onDigitizeTree) {
            onDigitizeTree(hoveredContext.unitId, hoveredContext.localX, hoveredContext.localY);
        }
    };

    if (isLoading || !vizModel) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center bg-app text-text-muted animate-pulse">
                <Target size={48} className="mb-4 opacity-20" />
                <span className="text-xs font-bold uppercase tracking-widest">Initializing Environment...</span>
            </div>
        );
    }

    return (
        <div
            className={clsx(
                "relative w-full h-full bg-app overflow-hidden select-none group",
                digitizationMode ? "cursor-none" : "cursor-default"
            )}
            style={{ width: viewportWidth, height: viewportHeight }}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setMousePos(null)}
            onClick={handleClick}
        >
            {/* --- 0. GLOBAL ANIMATION STYLES --- */}
            <style>{`
                @keyframes sway {
                    0%, 100% { transform: rotate(-3deg); }
                    50% { transform: rotate(3deg); }
                }
            `}</style>

            {/* Parent SVG must allow pointer events to pass through to children where 'pointer-events-auto' is set */}
            <svg width="100%" height="100%" className="absolute inset-0 pointer-events-none" style={{ overflow: 'visible' }}>

                {/* 1. Environment (Floor, Grid, Labels) */}
                <EnvironmentLayer
                    units={vizModel.units}
                    selectedUnitId={selectedUnitId}
                    onSelectUnit={!digitizationMode ? onSelectUnit : undefined}
                    showQuadrants={visualizationSettings?.showQuadrants ?? true}
                    showSubplots={visualizationSettings?.showSubplots ?? true}
                />

                {/* 2. Organisms (Trees) */}
                {visualizationSettings?.showTreeVisualization && vizModel.trees.map((tree, i) => (
                    <BioMarker
                        key={tree.id}
                        x={tree.screenX}
                        y={tree.screenY}
                        radius={tree.radius * 2} // Use scaled visual radius
                        species={tree.speciesName}
                        delay={i * 50} // Stagger animation for organic feel
                        onClick={!digitizationMode && onEditTree ? (e) => {
                            e.stopPropagation();
                            onEditTree(tree.id);
                        } : undefined}
                    />
                ))}

            </svg>

            {/* 3. Reticle (Interactive Overlay) - Only visible during Digitization */}
            {digitizationMode && snappedPos && (
                <div
                    className="absolute pointer-events-none z-50 transition-transform duration-75 ease-out"
                    style={{ transform: `translate(${snappedPos.screenX}px, ${snappedPos.screenY}px)` }}
                >
                    <div className="absolute -translate-x-1/2 -translate-y-1/2">
                        <div className={clsx("w-px h-10 transition-colors duration-200", hoveredContext ? "bg-success" : "bg-warning")} />
                        <div className={clsx("h-px w-10 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transition-colors duration-200", hoveredContext ? "bg-success" : "bg-warning")} />
                        <div className="w-4 h-4 border-2 border-white rounded-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 shadow-lg" />
                    </div>
                    {hoveredContext && (
                        <div className="absolute left-4 top-4 bg-panel/90 backdrop-blur-md border border-border px-3 py-2 rounded-lg shadow-xl text-xs whitespace-nowrap animate-in fade-in slide-in-from-left-2">
                            <div className="font-bold text-success flex items-center gap-2">
                                <Target size={12} /> {hoveredContext.label}
                            </div>
                            <div className="font-mono text-text-muted mt-1 border-t border-border pt-1">
                                X: {hoveredContext.localX.toFixed(2)}m <span className="mx-1 opacity-20">|</span> Y: {hoveredContext.localY.toFixed(2)}m
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* 4. HUD */}
            <TelemetryHUD
                plotCode={plot?.code || 'PLOT'}
                dimensions={plot?.configuration?.dimensions || { width: 0, length: 0 }}
                mode={digitizationMode ? 'DIGITIZE' : 'VIEW'}
                scale={vizModel.scale}
            />
        </div>
    );
};