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
    const { trees, progress } = usePlotObservations(plotId);

    // Derived state
    const progressByUnit = React.useMemo(() => normalizeProgress(progress), [progress]);
    const obsSummaryByUnit = React.useMemo(() => summarizeObservations(trees), [trees]);

    // Build unit label map from layout
    const unitLabelMap = useMemo(() => {
        if (!plot) return new Map<string, string>();

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

    const sortedUnitIds = useMemo(() => Array.from(unitLabelMap.keys()).sort(), [unitLabelMap]);

    // UI State
    const [containerWidth, setContainerWidth] = useState<number>(0);
    const [containerHeight, setContainerHeight] = useState<number>(0);
    const containerRef = React.useRef<HTMLDivElement>(null);
    const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'MAP' | 'LIST'>('MAP');
    const [isAddingTree, setIsAddingTree] = useState(false);
    const [isAddingVeg, setIsAddingVeg] = useState(false);
    const [editingTreeId, setEditingTreeId] = useState<string | null>(null);

    const [digitizeMode, setDigitizeMode] = useState<'NONE' | 'TREE' | 'VEG'>('NONE');
    const [initialPosition, setInitialPosition] = useState<{ x: number, y: number } | undefined>(undefined);

    const [panelFocus, setPanelFocus] = useState<'map' | 'panel' | 'none'>('none');
    const [panelHeight, setPanelHeight] = useState<number>(320);

    // Visualization Settings
    const defaultVizSettings: PlotVisualizationSettings = {
        showQuadrants: true,
        showSubplots: true,
        showQuadrantLines: false,
        showTreeVisualization: true,
        showLabels: true,
        subplotOpacity: 0.9,
    };

    const [vizSettings, setVizSettings] = useState<PlotVisualizationSettings>(defaultVizSettings);

    useEffect(() => {
        if (plot?.visualizationSettings) {
            setVizSettings({ ...defaultVizSettings, ...plot.visualizationSettings });
        } else {
            setVizSettings(defaultVizSettings);
        }
    }, [plot]);

    // Resize Observer
    useEffect(() => {
        if (!containerRef.current) return;
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

    // Adjust panel height
    useEffect(() => {
        if (panelFocus === 'map') {
            setPanelHeight(200);
        } else if (panelFocus === 'panel') {
            setPanelHeight(Math.min(window.innerHeight * 0.6, 480));
        } else {
            setPanelHeight(Math.min(window.innerHeight * 0.4, 320));
        }
    }, [panelFocus]);

    // Hide Footer
    useEffect(() => {
        document.body.classList.add('hide-footer');
        return () => document.body.classList.remove('hide-footer');
    }, []);

    // Handlers
    const handleSelectUnit = (unitId: string) => {
        setSelectedUnitId(unitId);
        setPanelFocus('none');
    };

    const handleStartSurvey = () => {
        if (progress.length > 0) {
            const firstNotStarted = progress.find(p => p.status === 'NOT_STARTED');
            const firstUnit = firstNotStarted || progress[0];
            if (firstUnit) setSelectedUnitId(firstUnit.samplingUnitId);
        }
    };

    const handleDigitizeClick = (unitId: string, x: number, y: number) => {
        setSelectedUnitId(unitId);
        setInitialPosition({ x, y });
        if (digitizeMode === 'TREE') setIsAddingTree(true);
        else if (digitizeMode === 'VEG') setIsAddingVeg(true);
        setDigitizeMode('NONE');
    };

    const handleEditTree = (treeId: string) => {
        setEditingTreeId(treeId);
    };

    const selectedUnitLabel = selectedUnitId ? (unitLabelMap.get(selectedUnitId) || "Unknown Unit") : "";

    return (
        <>
            {plotLoading || !plot ? (
                // UPDATED: Use bg-app instead of bg-[#050814]
                <div className="fixed inset-0 top-[64px] left-0 md:left-[256px] z-20 bg-app flex items-center justify-center">
                    <div className="p-8 text-text-muted">Loading Plot...</div>
                </div>
            ) : (
                // UPDATED: Use bg-app
                <div className="fixed inset-0 top-[64px] left-0 md:left-[256px] z-20 bg-app">
                    <div className="h-full flex flex-col bg-app overflow-hidden relative">
                        {/* Main Content */}
                        <div className="flex-1 flex flex-col relative min-h-0">
                            {/* Tabs / Toolbar: UPDATED Colors */}
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

                                <div className="flex-1" />

                                {/* Settings Menu */}
                                <PlotSettingsMenu
                                    settings={vizSettings}
                                    onSettingsChange={(newSettings) => {
                                        setVizSettings(newSettings);
                                        updateVisualizationSettings(newSettings);
                                    }}
                                />
                            </div>

                            {/* Canvas Area: UPDATED Background */}
                            <div
                                className="flex-1 relative overflow-hidden bg-app"
                                ref={containerRef}
                                onClick={() => setPanelFocus('map')}
                                style={{ minHeight: '200px' }}
                            >
                                {activeTab === 'MAP' && (
                                    <PlotCanvas
                                        plotId={plotId}
                                        viewportWidth={containerWidth || 400}
                                        viewportHeight={containerHeight || 400}
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

                        {/* Right Panel: UPDATED Colors */}
                        <div
                            className={clsx(
                                "bg-panel border-border shadow-2xl transition-all duration-300 overflow-y-auto",
                                "fixed bottom-0 left-0 right-0 border-t md:border-t-0",
                                "md:fixed md:top-[64px] md:right-0 md:bottom-0 md:left-auto md:w-[480px] md:border-l md:p-6",
                                (isAddingTree || isAddingVeg) && "hidden",
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

            {/* Forms: UPDATED Backgrounds */}
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
                        onSaveSuccess={() => { }}
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
                        onSaveSuccess={() => { }}
                    />
                </div>
            )}

            {editingTreeId && (
                <TreeEditForm
                    treeId={editingTreeId}
                    onClose={() => setEditingTreeId(null)}
                    onSaveSuccess={() => { }}
                />
            )}
        </>
    );
};