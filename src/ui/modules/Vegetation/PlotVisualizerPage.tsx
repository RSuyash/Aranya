import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Map as MapIcon, Info, ArrowLeft, Plus } from 'lucide-react';
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

export const PlotVisualizerPage: React.FC = () => {
    const { projectId, moduleId, plotId } = useParams<{ projectId: string; moduleId: string; plotId: string }>();
    const navigate = useNavigate();

    if (!projectId || !moduleId || !plotId) return <div>Invalid URL Parameters</div>;

    // Data
    const { plot, blueprint, isLoading: plotLoading, updateVisualizationSettings } = usePlotData(plotId);
    const { trees, veg, progress } = usePlotObservations(plotId);

    // Derived state
    const progressByUnit = React.useMemo(() => normalizeProgress(progress), [progress]);
    const obsSummaryByUnit = React.useMemo(() => summarizeObservations(trees), [trees]);

    // Build unit label map from layout
    const unitLabelMap = useMemo(() => {
        if (!plot) return new Map<string, string>();

        // Use dynamic layout generation for plots that have configuration
        if (plot.configuration) {
            const layout = generateDynamicLayout(plot.configuration, plotId);
            const map = new Map<string, string>();

            const collectLabels = (node: any) => {
                map.set(node.id, node.label);
                node.children?.forEach(collectLabels);
            };

            collectLabels(layout);
            return map;
        } else if (blueprint) {
            const layout = generateLayout(blueprint, undefined, plotId);
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
    const [activeTab, setActiveTab] = useState<'MAP' | 'LIST'>('MAP');
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
            // Merge saved settings with defaults to ensure all properties exist
            // This ensures that if a setting wasn't previously saved, the default is used
            setVizSettings({
                ...defaultVizSettings, // Start with defaults
                ...plot.visualizationSettings // Override with saved values where they exist
            });
        } else {
            // If no saved settings exist, use defaults (this resets to defaults when no plot settings exist)
            setVizSettings(defaultVizSettings);
        }
    }, [plot]);

    // Resize Observer
    useEffect(() => {
        if (!containerRef.current) return;

        // Immediate measurement
        const rect = containerRef.current.getBoundingClientRect();
        console.log('PlotVisualizerPage: Initial container size', rect.width, rect.height);
        setContainerWidth(rect.width);
        setContainerHeight(rect.height);

        const observer = new ResizeObserver((entries) => {
            for (const entry of entries) {
                console.log('PlotVisualizerPage: ResizeObserver', entry.contentRect.width, entry.contentRect.height);
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
            // Lower panel to give more map space
            setPanelHeight(200);
        } else if (panelFocus === 'panel') {
            // Raise panel for data entry
            setPanelHeight(Math.min(window.innerHeight * 0.6, 480));
        } else {
            // Default height
            setPanelHeight(Math.min(window.innerHeight * 0.4, 320));
        }
    }, [panelFocus]);

    // Hide AppShell footer on this page
    useEffect(() => {
        document.body.classList.add('hide-footer');
        return () => document.body.classList.remove('hide-footer');
    }, []);

    // Handlers
    const handleSelectUnit = (unitId: string) => {
        console.log('PlotVisualizerPage: Unit selected', unitId);
        setSelectedUnitId(unitId);
        setPanelFocus('none');
    };

    const handleStartSurvey = () => {
        console.log('PlotVisualizerPage: Start survey clicked', { progressCount: progress.length });
        // Auto-select first unit
        if (progress.length > 0) {
            const firstNotStarted = progress.find(p => p.status === 'NOT_STARTED');
            const firstUnit = firstNotStarted || progress[0];
            console.log('PlotVisualizerPage: Selecting first unit', firstUnit);
            if (firstUnit) {
                setSelectedUnitId(firstUnit.samplingUnitId);
            }
        }
    };

    const handleDigitizeClick = (unitId: string, x: number, y: number) => {
        console.log(`📍 Digitizing in Unit ${unitId} at (${x}, ${y})`);

        // 1. Select the Unit (Context Switching)
        setSelectedUnitId(unitId);

        // 2. Set Coordinates for Form
        setInitialPosition({ x, y });

        // 3. Open Correct Form
        if (digitizeMode === 'TREE') {
            setIsAddingTree(true);
        } else if (digitizeMode === 'VEG') {
            setIsAddingVeg(true);
        }

        // 4. Reset Mode (Optional: keep on for rapid entry?)
        setDigitizeMode('NONE');
    };

    // Get actual unit label from layout
    const selectedUnitLabel = selectedUnitId ? (unitLabelMap.get(selectedUnitId) || "Unknown Unit") : "";

    return (
        <>
            {plotLoading || !plot ? (
                <div className="fixed inset-0 top-[64px] left-0 md:left-[256px] z-20 bg-[#050814] flex items-center justify-center">
                    <div className="p-8 text-white">Loading Plot...</div>
                </div>
            ) : (
                <div className="fixed inset-0 top-[64px] left-0 md:left-[256px] z-20 bg-[#050814]">
                    <div className="h-full flex flex-col bg-[#050814] overflow-hidden relative">
                        {/* Main Content Area (Map/List) */}
                        <div className="flex-1 flex flex-col relative min-h-0">
                            {/* Tabs / Toolbar */}
                            <div className="h-12 border-b border-[#1d2440] flex items-center px-4 md:pr-[496px] gap-4 bg-[#0b1020] z-10 flex-shrink-0 min-w-0">
                                {/* Back Button */}
                                <button
                                    onClick={() => navigate(`/project/${projectId}/module/${moduleId}`)}
                                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-[#9ba2c0] hover:text-[#f5f7ff] hover:bg-[#1d2440] transition"
                                    title="Back to Project"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                    <span className="hidden sm:inline">Back</span>
                                </button>

                                {/* Vertical Divider */}
                                <div className="h-6 w-px bg-[#1d2440]" />

                                <button
                                    onClick={() => setActiveTab('MAP')}
                                    className={clsx(
                                        "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition",
                                        activeTab === 'MAP' ? "bg-[#1d2440] text-[#56ccf2]" : "text-[#9ba2c0] hover:text-[#f5f7ff]"
                                    )}
                                >
                                    <MapIcon className="w-4 h-4" /> Map
                                </button>
                                <button
                                    onClick={() => setActiveTab('LIST')}
                                    className={clsx(
                                        "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition",
                                        activeTab === 'LIST' ? "bg-[#1d2440] text-[#56ccf2]" : "text-[#9ba2c0] hover:text-[#f5f7ff]"
                                    )}
                                >
                                    <Info className="w-4 h-4" /> List
                                </button>

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
                                {activeTab === 'MAP' && (
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
                                )}
                                {activeTab === 'LIST' && (
                                    <div className="p-8 text-[#9ba2c0] text-center">
                                        List View Coming Soon
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right Panel / Bottom Sheet Area - Overlay on Desktop, Bottom sheet on Mobile */}
                        <div
                            className={clsx(
                                "bg-[#0b1020] border-[#1d2440] shadow-2xl transition-all duration-300 overflow-y-auto",
                                // Mobile: bottom sheet
                                "fixed bottom-0 left-0 right-0 border-t md:border-t-0",
                                // Desktop: right sidebar overlay - wider for better content display
                                "md:fixed md:top-[64px] md:right-0 md:bottom-0 md:left-auto md:w-[480px] md:border-l md:p-6",
                                (isAddingTree || isAddingVeg) && "hidden", // Hide panel when forms are open
                                "z-20"
                            )}
                            style={{
                                height: (window.innerWidth >= 768 ? 'calc(100vh - 64px)' : `${panelHeight}px`),
                            }}
                            onClick={() => setPanelFocus('panel')}
                        >
                            {selectedUnitId ? (
                                <UnitDetailPanel
                                    projectId={projectId}
                                    moduleId={moduleId}
                                    plotId={plotId}
                                    unitId={selectedUnitId}
                                    unitLabel={selectedUnitLabel}
                                    onClose={() => setSelectedUnitId(null)}
                                    progress={progressByUnit[selectedUnitId]}
                                    obsSummary={obsSummaryByUnit[selectedUnitId]}
                                    onAddTree={() => {
                                        setInitialPosition(undefined); // Reset position for manual add
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

            {/* Full-screen forms rendered separately to ensure they overlay everything properly */}
            {plot && !plotLoading && isAddingTree && selectedUnitId && (
                <div className="fixed inset-0 top-[64px] left-0 md:left-[256px] w-full h-[calc(100vh-64px)] md:w-[calc(100vw-256px)] z-50 bg-[#050814]">
                    <TreeEntryForm
                        key={`${selectedUnitId}-${initialPosition?.x ?? 'manual'}-${initialPosition?.y ?? 'manual'}`}
                        projectId={projectId}
                        moduleId={moduleId}
                        plotId={plotId}
                        unitId={selectedUnitId}
                        unitLabel={selectedUnitLabel}
                        initialPosition={initialPosition}
                        onClose={() => setIsAddingTree(false)}
                        onSaveSuccess={() => {
                            // Refresh data handled by live query
                        }}
                    />
                </div>
            )}

            {plot && !plotLoading && isAddingVeg && selectedUnitId && (
                <div className="fixed inset-0 top-[64px] left-0 md:left-[256px] w-full h-[calc(100vh-64px)] md:w-[calc(100vw-256px)] z-50 bg-[#050814]">
                    <VegetationEntryForm
                        key={`${selectedUnitId}-${initialPosition?.x ?? 'manual'}-${initialPosition?.y ?? 'manual'}`}
                        projectId={projectId}
                        moduleId={moduleId}
                        plotId={plotId}
                        unitId={selectedUnitId}
                        unitLabel={selectedUnitLabel}
                        onClose={() => setIsAddingVeg(false)}
                        onSaveSuccess={() => {
                            // Refresh data handled by live query
                        }}
                    />
                </div>
            )}
        </>
    );
};

