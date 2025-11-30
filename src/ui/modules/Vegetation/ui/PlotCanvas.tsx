import React, { useMemo, useState, useRef, useEffect } from 'react';
import { usePlotData } from '../data/usePlotData';
import { usePlotObservations } from '../data/usePlotObservations';
import { generateLayout } from '../../../../core/plot-engine/generateLayout';
import { generateDynamicLayout } from '../../../../core/plot-engine/dynamicGenerator';
import { buildPlotVizModel } from '../viz/buildPlotVizModel';
import { EnvironmentLayer } from './layers/EnvironmentLayer';
import { clsx } from 'clsx';
import { Target } from 'lucide-react';
import { TelemetryHUD } from './TelemetryHUD';
// [Vance Fix] Import the Extended Type
import type { ExtendedVizSettings } from './PlotSettingsMenu';

// --- VANCE UTILS: CHROMATIC TAXONOMY ---
const getSpeciesColor = (species: string) => {
    let hash = 0;
    for (let i = 0; i < species.length; i++) {
        hash = species.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash % 360);
    return `hsl(${hue}, 70%, 50%)`;
};

interface PlotCanvasProps {
    plotId: string;
    viewportWidth: number;
    viewportHeight: number;
    selectedUnitId?: string;
    onSelectUnit?: (unitId: string) => void;
    digitizationMode?: boolean;
    onDigitizeTree?: (unitId: string, x: number, y: number) => void;
    // [Vance Fix] Update type definition
    visualizationSettings?: ExtendedVizSettings;
    onEditTree?: (treeId: string) => void;
    searchQuery?: string;
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
    searchQuery = ''
}) => {
    const { plot, blueprint, isLoading } = usePlotData(plotId);
    const { trees, veg, progress } = usePlotObservations(plotId);
    const [mousePos, setMousePos] = useState<{ x: number, y: number } | null>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Animation State
    const frameRef = useRef<number>(0);
    const timeRef = useRef<number>(0);

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

        const clampedX = Math.max(0, Math.min(plot.configuration.dimensions.width, metersX));
        const clampedY = Math.max(0, Math.min(plot.configuration.dimensions.length, metersY));

        const screenX = mainPlot.screenX + (clampedX * scaleX);
        const screenY = mainPlot.screenY + ((plot.configuration.dimensions.length - clampedY) * scaleY);

        return { screenX, screenY, metersX: clampedX, metersY: clampedY };
    }, [mousePos, vizModel, plot]);

    // 4. Hit Testing
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

    const handleClick = (e: React.MouseEvent) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;

        if (digitizationMode && hoveredContext && onDigitizeTree) {
            onDigitizeTree(hoveredContext.unitId, hoveredContext.localX, hoveredContext.localY);
            return;
        }

        if (!digitizationMode && vizModel && visualizationSettings?.showTreeVisualization) {
            for (let i = vizModel.trees.length - 1; i >= 0; i--) {
                const tree = vizModel.trees[i];
                const dx = clickX - tree.screenX;
                const dy = clickY - tree.screenY;
                const hitRadius = Math.max(tree.radius, 20);

                if (dx * dx + dy * dy <= hitRadius * hitRadius) {
                    if (onEditTree) {
                        onEditTree(tree.id);
                        e.stopPropagation();
                    }
                    return;
                }
            }
        }

        if (!digitizationMode && onSelectUnit && hoveredContext) {
            onSelectUnit(hoveredContext.unitId);
        }
    };

    // --- 5. THE VANCE RENDER LOOP ---
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !vizModel || !visualizationSettings?.showTreeVisualization) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const dpr = window.devicePixelRatio || 1;
        if (canvas.width !== viewportWidth * dpr) {
            canvas.width = viewportWidth * dpr;
            canvas.height = viewportHeight * dpr;
            canvas.style.width = `${viewportWidth}px`;
            canvas.style.height = `${viewportHeight}px`;
            ctx.scale(dpr, dpr);
        }

        const cleanQuery = searchQuery.toLowerCase().trim();

        // Animation Loop
        const render = () => {
            timeRef.current += 0.05; // Time tick
            ctx.clearRect(0, 0, viewportWidth, viewportHeight);

            // Clipping
            const mainPlot = vizModel.units.find(u => u.role === 'MAIN_PLOT');
            if (mainPlot) {
                ctx.save();
                ctx.beginPath();
                ctx.rect(mainPlot.screenX, mainPlot.screenY, mainPlot.screenWidth, mainPlot.screenHeight);
                ctx.clip();
            }

            // --- RENDER TREES ---
            vizModel.trees.forEach((tree) => {
                // Filter Logic: "The Lens"
                let isMatch = true;
                let opacity = 1.0;

                if (cleanQuery) {
                    const matchText = `${tree.speciesName} ${tree.id}`.toLowerCase();
                    isMatch = matchText.includes(cleanQuery);
                    opacity = isMatch ? 1.0 : 0.1; // Dim non-matches
                }

                // Physics: "The Breath"
                const phase = tree.screenX * 0.1 + tree.screenY * 0.1;
                const sway = isMatch ? Math.sin(timeRef.current + phase) * (tree.radius * 0.15) : 0;

                const radius = tree.radius;
                const drawX = tree.screenX + sway;
                const drawY = tree.screenY;

                ctx.globalAlpha = opacity;

                // Draw Tree
                ctx.beginPath();
                ctx.arc(drawX, drawY, radius, 0, 2 * Math.PI);

                // [Vance Injection: Biometric Lens Logic]
                const mode = visualizationSettings?.colorMode || 'SPECIES';

                let fillStyle = '#ccc';

                if (mode === 'SPECIES') {
                    fillStyle = getSpeciesColor(tree.speciesName);
                }
                else if (mode === 'STRUCTURE') {
                    // Gradient from Green (Small) -> Yellow -> Red (Massive)
                    const gbh = tree.gbh || 10;
                    if (gbh < 30) fillStyle = '#4ade80'; // Green-400 (Sapling)
                    else if (gbh < 60) fillStyle = '#22c55e'; // Green-500 (Young)
                    else if (gbh < 100) fillStyle = '#eab308'; // Yellow-500 (Mature)
                    else if (gbh < 200) fillStyle = '#f97316'; // Orange-500 (Large)
                    else fillStyle = '#ef4444'; // Red-500 (Giant)
                }
                else if (mode === 'VITALITY') {
                    // Parse condition (Assuming string enum in Data Model)
                    const cond = (tree.condition || 'ALIVE').toUpperCase();
                    if (cond === 'ALIVE') fillStyle = '#22c55e'; // Green
                    else if (cond === 'DAMAGED') fillStyle = '#f97316'; // Orange
                    else if (cond === 'DYING') fillStyle = '#ef4444'; // Red
                    else if (cond === 'DEAD') fillStyle = '#9ca3af'; // Gray
                    else fillStyle = '#22c55e'; // Default
                }

                ctx.fillStyle = fillStyle;
                ctx.strokeStyle = 'rgba(0,0,0,0.2)';
                ctx.lineWidth = 1;

                // Selection / Match Glow
                if (cleanQuery && isMatch) {
                    ctx.shadowColor = 'rgba(255,255,255,0.8)';
                    ctx.shadowBlur = 10;
                    ctx.strokeStyle = '#fff';
                    ctx.lineWidth = 2;
                } else {
                    ctx.shadowColor = 'rgba(0,0,0,0.2)';
                    ctx.shadowBlur = 2;
                    ctx.shadowOffsetY = 1;
                }

                ctx.fill();
                ctx.stroke();

                // Reset shadow
                ctx.shadowColor = 'transparent';
                ctx.shadowBlur = 0;
            });

            if (mainPlot) {
                ctx.restore();
            }

            // Continue loop
            frameRef.current = requestAnimationFrame(render);
        };

        render();

        return () => cancelAnimationFrame(frameRef.current);

    }, [vizModel, viewportWidth, viewportHeight, visualizationSettings, searchQuery]);


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
            {/* 1. Environment Layer (SVG) - Grid, Labels, Floor */}
            <svg width="100%" height="100%" className="absolute inset-0 pointer-events-none" style={{ overflow: 'visible' }}>
                <EnvironmentLayer
                    units={vizModel.units}
                    selectedUnitId={selectedUnitId}
                    onSelectUnit={undefined}
                    showQuadrants={visualizationSettings?.showQuadrants ?? true}
                    showSubplots={visualizationSettings?.showSubplots ?? true}
                />
            </svg>

            {/* 2. Trees Layer (Canvas) - Animated & Filtered */}
            <canvas
                ref={canvasRef}
                className="absolute inset-0"
            />

            {/* 3. Reticle (Digitization) */}
            {digitizationMode && snappedPos && (
                <div
                    className="absolute pointer-events-none z-50 transition-transform duration-75 ease-out"
                    style={{ transform: `translate(${snappedPos.screenX}px, ${snappedPos.screenY}px)` }}
                >
                    {/* ... (Existing Reticle Code) ... */}
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