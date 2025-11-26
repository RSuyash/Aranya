import React, { useState, useEffect, useMemo } from 'react';
import { Map as MapIcon, Plus } from 'lucide-react';
import { UnitDetailPanel } from './UnitDetailPanel';
import { PlotOverviewPanel } from './PlotOverviewPanel';
import { TreeEntryForm } from './TreeEntryForm';
import { VegetationEntryForm } from './VegetationEntryForm';
import { normalizeProgress, summarizeObservations } from './plotVisualizerUtils';
import { PlotCanvas } from './ui/PlotCanvas';
import { PlotSettingsMenu } from './ui/PlotSettingsMenu';
import { usePlotData } from './data/usePlotData';
import { usePlotObservations } from './data/usePlotObservations';
import { generateLayout } from '../../../core/plot-engine/generateLayout';
import { generateDynamicLayout } from '../../../core/plot-engine/dynamicGenerator';
import { clsx } from 'clsx';
import type { PlotVisualizationSettings } from '../../../core/data-model/types';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../../core/data-model/dexie';

interface PlotVisualizerProps {
    projectId: string;
    plotId?: string;
}

export const PlotVisualizer: React.FC<PlotVisualizerProps> = ({ projectId, plotId: propPlotId }) => {
    // Fetch all plots to handle selection and empty states correctly
    const plots = useLiveQuery(() => db.plots.where('projectId').equals(projectId).toArray(), [projectId]);

    // Determine active plot ID
    // If propPlotId is provided, use it.
    // Otherwise, use the first plot from the list.
    const plotId = propPlotId || plots?.[0]?.id;

    // Data
    // We pass plotId || '' to hooks, but we handle the 'no plot' case below explicitly
    const { plot, blueprint, isLoading: plotLoading, updateVisualizationSettings } = usePlotData(plotId || '');
    const { trees, progress } = usePlotObservations(plotId || '');

    // Derived state
    const progressByUnit = React.useMemo(() => normalizeProgress(progress), [progress]);
    const obsSummaryByUnit = React.useMemo(() => summarizeObservations(trees), [trees]);

    // Build unit label map from layout
    const unitLabelMap = useMemo(() => {
        if (!plot) return new Map<string, string>();

        // Use dynamic layout generation for plots that have configuration
        if (plot.configuration) {
            const layout = generateDynamicLayout(plot.configuration, plotId!);
            const map = new Map<string, string>();

            const collectLabels = (node: any) => {
                map.set(node.id, node.label);
                node.children?.forEach(collectLabels);
            };

            collectLabels(layout);
            return map;
        } else if (blueprint) {
            const layout = generateLayout(blueprint, undefined, plotId!);
            const map = new Map<string, string>();

            const collectLabels = (node: any) => {
                map.set(node.id, node.label);
                node.children?.forEach(collectLabels);
            };

            collectLabels(layout);
            return map;
        }

        return new Map<string, string>();
    }, [blueprint, plot, plotId]);

    // Create sorted list of unit IDs for navigation
    const sortedUnitIds = useMemo(() => {
        return Array.from(unitLabelMap.keys()).sort();
    }, [unitLabelMap]);

    // UI State
    const [containerWidth, setContainerWidth] = useState<number>(0);
    const [containerHeight, setContainerHeight] = useState<number>(0);
    const containerRef = React.useRef<HTMLDivElement>(null);
    const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
    const [isAddingTree, setIsAddingTree] = useState(false);
    const [isAddingVeg, setIsAddingVeg] = useState(false);

    const [digitizeMode, setDigitizeMode] = useState<'NONE' | 'TREE' | 'VEG'>('NONE');
    const [initialPosition, setInitialPosition] = useState<{ x: number, y: number } | undefined>(undefined);

    // Panel interaction state
    const [panelFocus, setPanelFocus] = useState<'map' | 'panel' | 'none'>('none');
    const [panelHeight, setPanelHeight] = useState<number>(320); // 40vh on typical mobile

    // Visualization Settings State
    const defaultVizSettings: PlotVisualizationSettings = {
        showQuadrants: true,
        showSubplots: true,
        showQuadrantLines: false,
        showTreeVisualization: true, // Trees should be visible by default
        showLabels: true,
        subplotOpacity: 0.9,
    };

    const [vizSettings, setVizSettings] = useState<PlotVisualizationSettings>(defaultVizSettings);

    // Load visualization settings from plot metadata on mount
    useEffect(() => {
        if (plot?.visualizationSettings) {
            setVizSettings({
                ...defaultVizSettings,
                ...plot.visualizationSettings
            });
        } else {
            setVizSettings(defaultVizSettings);
        }
    }, [plot]);

    // Resize Observer
    useEffect(() => {
        if (!containerRef.current) return;

        // Immediate measurement
        const rect = containerRef.current.getBoundingClientRect();
        setContainerWidth(rect.width);
        setContainerHeight(rect.height);

        const observer = new ResizeObserver((entries) => {
            for (const entry of entries) {
                setContainerWidth(entry.contentRect.width);
                setContainerHeight(entry.contentRect.height);
            }
        });
        observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, []);

    // Adjust panel height based on focus
    useEffect(() => {
        if (panelFocus === 'map') {
            setPanelHeight(200);
        } else if (panelFocus === 'panel') {
            setPanelHeight(Math.min(window.innerHeight * 0.6, 480));
        } else {
            setPanelHeight(Math.min(window.innerHeight * 0.4, 320));
        }
    }, [panelFocus]);

    // Handlers
    const handleSelectUnit = (unitId: string) => {
        console.log('PlotVisualizer: Unit selected', unitId);
        setSelectedUnitId(unitId);
        setPanelFocus('none');
    };

    const handleStartSurvey = () => {
        // Auto-select first unit
        if (progress.length > 0) {
            const firstNotStarted = progress.find(p => p.status === 'NOT_STARTED');
            const firstUnit = firstNotStarted || progress[0];
            if (firstUnit) {
                setSelectedUnitId(firstUnit.samplingUnitId);
            }
        }
    };

    const handleDigitizeClick = (unitId: string, x: number, y: number) => {
        console.log(`📍 Digitizing in Unit ${unitId} at (${x}, ${y})`);
        setSelectedUnitId(unitId);
        setInitialPosition({ x, y });

        if (digitizeMode === 'TREE') {
            setIsAddingTree(true);
        } else if (digitizeMode === 'VEG') {
            setIsAddingVeg(true);
        }
        setDigitizeMode('NONE');
    };

    // Get actual unit label from layout
    const selectedUnitLabel = selectedUnitId ? (unitLabelMap.get(selectedUnitId) || "Unknown Unit") : "";

    // Loading state for the plots list itself
    if (!plots) {
        return (
            <div className="flex items-center justify-center h-full bg-[#050814]">
                <div className="p-8 text-white">Loading Plots...</div>
            </div>
        );
    }

    if (!plotId) {
        return (
            <div className="flex items-center justify-center h-full text-[#9ba2c0]">
                <div className="text-center">
                    <MapIcon className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p>No plots found in this project.</p>
                    <button className="mt-4 px-4 py-2 bg-[#52d273] text-[#050814] rounded-lg font-bold text-sm">
                        Create First Plot
                    </button>
                </div>
            </div>
        );
    }

    return (
        <>
            {plotLoading || !plot ? (
                <div className="absolute inset-0 z-20 bg-[#050814] flex items-center justify-center">
                    <div className="p-8 text-white">Loading Plot...</div>
                </div>
            ) : (
                <div className="absolute inset-0 z-20 bg-[#050814]">
                    <div className="h-full flex flex-col bg-[#050814] overflow-hidden relative">
                        {/* Main Content Area (Map/List) */}
                        <div className="flex-1 flex flex-col relative min-h-0">
                            {/* Tabs / Toolbar */}
                            <div className="h-12 border-b border-[#1d2440] flex items-center px-4 gap-4 bg-[#0b1020] z-10 flex-shrink-0 min-w-0">

                                <div className="text-sm font-bold text-[#f5f7ff] mr-4">
                                    {plot.name}
                                </div>

                                {/* Vertical Divider */}
                                <div className="h-6 w-px bg-[#1d2440]" />

                                {/* Digitize Toggle Group */}
                                <div className="flex bg-[#1d2440] rounded-lg p-1 gap-1">
                                    <button
                                        onClick={() => setDigitizeMode(digitizeMode === 'TREE' ? 'NONE' : 'TREE')}
                                        className={clsx(
                                            "px-3 py-1.5 text-xs font-medium rounded-md transition flex items-center gap-2",
                                            digitizeMode === 'TREE' ? "bg-[#52d273] text-[#050814]" : "text-[#9ba2c0] hover:text-white"
                                        )}
                                    >
                                        <Plus className="w-3 h-3" /> Tree
                                    </button>
                                    <button
                                        onClick={() => setDigitizeMode(digitizeMode === 'VEG' ? 'NONE' : 'VEG')}
                                        className={clsx(
                                            "px-3 py-1.5 text-xs font-medium rounded-md transition flex items-center gap-2",
                                            digitizeMode === 'VEG' ? "bg-[#56ccf2] text-[#050814]" : "text-[#9ba2c0] hover:text-white"
                                        )}
                                    >
                                        <Plus className="w-3 h-3" /> Herb
                                    </button>
                                </div>

                                {/* Spacer */}
                                <div className="flex-1" />

                                {/* Visualization Settings Menu */}
                                <PlotSettingsMenu
                                    settings={vizSettings}
                                    onSettingsChange={(newSettings) => {
                                        setVizSettings(newSettings);
                                        updateVisualizationSettings(newSettings);
                                    }}
                                />
                            </div>

                            {/* Canvas Area */}
                            <div
                                className="flex-1 relative overflow-hidden bg-[#050814]"
                                ref={containerRef}
                                onClick={() => setPanelFocus('map')}
                                style={{ minHeight: '200px' }}
                            >
                                <PlotCanvas
                                    plotId={plotId}
                                    viewportWidth={containerWidth || (containerRef.current?.getBoundingClientRect().width || 400)}
                                    viewportHeight={containerHeight || (containerRef.current?.getBoundingClientRect().height || 400)}
                                    selectedUnitId={selectedUnitId || undefined}
                                    onSelectUnit={handleSelectUnit}
                                    visualizationSettings={vizSettings}
                                    digitizationMode={digitizeMode !== 'NONE'}
                                    onDigitizeTree={handleDigitizeClick}
                                />
                            </div>
                        </div>

                        {/* Right Panel / Bottom Sheet Area */}
                        <div
                            className={clsx(
                                "bg-[#0b1020] border-[#1d2440] shadow-2xl transition-all duration-300 overflow-y-auto",
                                "fixed bottom-0 left-0 right-0 border-t md:border-t-0",
                                // Adjusted positioning to be relative to this container if possible, 
                                // but fixed is safer for z-index. 
                                // We might need to adjust "top" if we are inside a tab.
                                // For now, let's keep it fixed but adjust top to be below the header.
                                "md:absolute md:top-0 md:right-0 md:bottom-0 md:left-auto md:w-[480px] md:border-l md:p-6",
                                (isAddingTree || isAddingVeg) && "hidden",
                                "z-20"
                            )}
                            style={{
                                height: (window.innerWidth >= 768 ? '100%' : `${panelHeight}px`),
                            }}
                            onClick={() => setPanelFocus('panel')}
                        >
                            {selectedUnitId ? (
                                <UnitDetailPanel
                                    projectId={projectId}
                                    moduleId={plot.moduleId}
                                    plotId={plotId}
                                    unitId={selectedUnitId}
                                    unitLabel={selectedUnitLabel}
                                    onClose={() => setSelectedUnitId(null)}
                                    progress={progressByUnit[selectedUnitId]}
                                    obsSummary={obsSummaryByUnit[selectedUnitId]}
                                    onAddTree={() => {
                                        setInitialPosition(undefined);
                                        setIsAddingTree(true);
                                    }}
                                    onAddVeg={() => setIsAddingVeg(true)}
                                    onNextUnit={(() => {
                                        const currentIndex = sortedUnitIds.indexOf(selectedUnitId);
                                        const nextIndex = currentIndex + 1;
                                        if (nextIndex < sortedUnitIds.length) {
                                            return () => setSelectedUnitId(sortedUnitIds[nextIndex]);
                                        }
                                        return undefined;
                                    })()}
                                    onPrevUnit={(() => {
                                        const currentIndex = sortedUnitIds.indexOf(selectedUnitId);
                                        const prevIndex = currentIndex - 1;
                                        if (prevIndex >= 0) {
                                            return () => setSelectedUnitId(sortedUnitIds[prevIndex]);
                                        }
                                        return undefined;
                                    })()}
                                    plot={plot}
                                />
                            ) : (
                                <PlotOverviewPanel
                                    plot={plot}
                                    progressByUnit={progressByUnit}
                                    obsSummaryByUnit={obsSummaryByUnit}
                                    onStartSurvey={handleStartSurvey}
                                />
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Full-screen forms */}
            {plot && !plotLoading && isAddingTree && selectedUnitId && (
                <div className="fixed inset-0 top-[64px] left-0 md:left-[256px] w-full h-[calc(100vh-64px)] md:w-[calc(100vw-256px)] z-50 bg-[#050814]">
                    <TreeEntryForm
                        key={`${selectedUnitId}-${initialPosition?.x ?? 'manual'}-${initialPosition?.y ?? 'manual'}`}
                        projectId={projectId}
                        moduleId={plot.moduleId}
                        plotId={plotId}
                        unitId={selectedUnitId}
                        unitLabel={selectedUnitLabel}
                        initialPosition={initialPosition}
                        onClose={() => setIsAddingTree(false)}
                        onSaveSuccess={() => { }}
                    />
                </div>
            )}

            {plot && !plotLoading && isAddingVeg && selectedUnitId && (
                <div className="fixed inset-0 top-[64px] left-0 md:left-[256px] w-full h-[calc(100vh-64px)] md:w-[calc(100vw-256px)] z-50 bg-[#050814]">
                    <VegetationEntryForm
                        key={`${selectedUnitId}-${initialPosition?.x ?? 'manual'}-${initialPosition?.y ?? 'manual'}`}
                        projectId={projectId}
                        moduleId={plot.moduleId}
                        plotId={plotId}
                        unitId={selectedUnitId}
                        unitLabel={selectedUnitLabel}
                        onClose={() => setIsAddingVeg(false)}
                        onSaveSuccess={() => { }}
                    />
                </div>
            )}
        </>
    );
};
