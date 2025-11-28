import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Map as MapIcon, Info, ArrowLeft, Plus } from 'lucide-react';
import { UnitDetailPanel } from './UnitDetailPanel';
import { PlotOverviewPanel } from './PlotOverviewPanel';
import { TreeEntryForm } from './components/TreeEntryForm';
import { TreeEditForm } from './TreeEditForm';
import { VegetationEntryForm } from './VegetationEntryForm';
import { normalizeProgress, summarizeObservations } from './plotVisualizerUtils';
import { PlotCanvas } from './ui/PlotCanvas';
import { PlotSettingsMenu } from './ui/PlotSettingsMenu';
import { usePlotData } from './data/usePlotData';
import { usePlotObservations } from './data/usePlotObservations';
import { clsx } from 'clsx';
import type { PlotVisualizationSettings } from '../../../core/data-model/types';
import { useResponsive } from '../../../hooks/useResponsive';

export const PlotVisualizerPage: React.FC = () => {
    const { projectId, moduleId, plotId } = useParams<{ projectId: string; moduleId: string; plotId: string }>();
    const navigate = useNavigate();

    if (!projectId || !moduleId || !plotId) return <div>Invalid URL Parameters</div>;

    // Data
    const { plot, isLoading: plotLoading, updateVisualizationSettings, unitLabelMap } = usePlotData(plotId);
    const { trees, progress } = usePlotObservations(plotId);

    // Derived state
    const progressByUnit = React.useMemo(() => normalizeProgress(progress), [progress]);
    const obsSummaryByUnit = React.useMemo(() => summarizeObservations(trees), [trees]);

    // Create sorted list of unit IDs for navigation
    const sortedUnitIds = useMemo(() => {
        return Array.from(unitLabelMap.keys()).sort();
    }, [unitLabelMap]);

    // UI State
    const containerRef = React.useRef<HTMLDivElement>(null);
    const { width: containerWidth, height: containerHeight } = useResponsive(containerRef);

    const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'MAP' | 'LIST'>('MAP');
    const [isAddingTree, setIsAddingTree] = useState(false);
    const [isAddingVeg, setIsAddingVeg] = useState(false);
    const [editingTreeId, setEditingTreeId] = useState<string | null>(null);

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

    const handleEditTree = (treeId: string) => {
        setEditingTreeId(treeId);
    };

    // Get actual unit label from layout
    const selectedUnitLabel = selectedUnitId ? (unitLabelMap.get(selectedUnitId) || "Unknown Unit") : "";

    return (
        <>
            {plotLoading || !plot ? (
                <div className="fixed inset-0 top-[64px] left-0 md:left-[256px] z-20 bg-app flex items-center justify-center">
                    <div className="p-8 text-white">Loading Plot...</div>
                </div>
            ) : (
                <div className="fixed inset-0 top-[64px] left-0 md:left-[256px] z-20 bg-app">
                    <div className="h-full flex flex-col bg-app overflow-hidden relative">
                        {/* Main Content Area (Map/List) */}
                        <div className="flex-1 flex flex-col relative min-h-0">
                            {/* Tabs / Toolbar */}
                            <div className="h-12 border-b border-border flex items-center px-4 md:pr-[496px] gap-4 bg-panel z-10 flex-shrink-0 min-w-0">
                                {/* Back Button */}
                                <button
                                    onClick={() => navigate(`/project/${projectId}/module/${moduleId}`)}
                                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-text-muted hover:text-text-main hover:bg-panel-soft transition"
                                    title="Back to Project"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                    <span className="hidden sm:inline">Back</span>
                                </button>

                                {/* Vertical Divider */}
                                <div className="h-6 w-px bg-border" />

                                <button
                                    onClick={() => setActiveTab('MAP')}
                                    className={clsx(
                                        "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition",
                                        activeTab === 'MAP' ? "bg-panel-soft text-primary" : "text-text-muted hover:text-text-main"
                                    )}
                                >
                                    <MapIcon className="w-4 h-4" /> Map
                                </button>
                                <button
                                    onClick={() => setActiveTab('LIST')}
                                    className={clsx(
                                        "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition",
                                        activeTab === 'LIST' ? "bg-panel-soft text-primary" : "text-text-muted hover:text-text-main"
                                    )}
                                >
                                    <Info className="w-4 h-4" /> List
                                </button>

                                {/* Digitize Toggle Group */}
                                <div className="flex bg-panel-soft rounded-lg p-1 gap-1 border border-border">
                                    <button
                                        onClick={() => setDigitizeMode(digitizeMode === 'TREE' ? 'NONE' : 'TREE')}
                                        className={clsx(
                                            "px-3 py-1.5 text-xs font-medium rounded-md transition flex items-center gap-2",
                                            digitizeMode === 'TREE' ? "bg-success text-app shadow-sm" : "text-text-muted hover:text-text-main"
                                        )}
                                    >
                                        <Plus className="w-3 h-3" /> Tree
                                    </button>
                                    <button
                                        onClick={() => setDigitizeMode(digitizeMode === 'VEG' ? 'NONE' : 'VEG')}
                                        className={clsx(
                                            "px-3 py-1.5 text-xs font-medium rounded-md transition flex items-center gap-2",
                                            digitizeMode === 'VEG' ? "bg-primary text-app shadow-sm" : "text-text-muted hover:text-text-main"
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
                                className="flex-1 relative overflow-hidden bg-app"
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
                                        onEditTree={handleEditTree}
                                    />
                                )}
                                {activeTab === 'LIST' && (
                                    <div className="p-8 text-text-muted text-center">
                                        List View Coming Soon
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right Panel / Bottom Sheet Area - Overlay on Desktop, Bottom sheet on Mobile */}
                        <div
                            className={clsx(
                                "bg-panel border-border shadow-2xl transition-all duration-300 overflow-y-auto",
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
                                    plot={plot}
                                    onEditTree={handleEditTree}
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
                <div className="fixed inset-0 top-[64px] left-0 md:left-[256px] w-full h-[calc(100vh-64px)] md:w-[calc(100vw-256px)] z-50 bg-app">
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
                <div className="fixed inset-0 top-[64px] left-0 md:left-[256px] w-full h-[calc(100vh-64px)] md:w-[calc(100vw-256px)] z-50 bg-app">
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

            {/* Edit Tree Form */}
            {editingTreeId && (
                <TreeEditForm
                    treeId={editingTreeId}
                    onClose={() => setEditingTreeId(null)}
                    onSaveSuccess={() => {
                        // Refresh handled by live query
                    }}
                />
            )}
        </>
    );
};

