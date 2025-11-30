import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../../core/data-model/dexie';
import { Map as MapIcon, Table, Plus, Target, Calendar, ArrowRight } from 'lucide-react';
import { clsx } from 'clsx';
import { v4 as uuidv4 } from 'uuid';

interface FieldDataContainerProps {
    projectId: string;
}

export const FieldDataContainer: React.FC<FieldDataContainerProps> = ({ projectId }) => {
    const navigate = useNavigate();
    const [viewMode, setViewMode] = useState<'MAP' | 'LIST'>('LIST');
    const [isNewPlotModalOpen, setIsNewPlotModalOpen] = useState(false);
    const [newPlotName, setNewPlotName] = useState('');

    // Live Data Connection
    const plots = useLiveQuery(
        () => db.plots.where('projectId').equals(projectId).toArray(),
        [projectId]
    ) || [];

    const handleCreatePlot = async () => {
        if (!newPlotName.trim()) return;

        const id = uuidv4();
        const now = Date.now();

        // Initialize Plot
        await db.plots.add({
            id,
            projectId,
            moduleId: 'vegetation', // Defaulting to Vegetation for now
            name: newPlotName,
            code: newPlotName.substring(0, 6).toUpperCase(),
            blueprintId: 'std-10x10-4q',
            blueprintVersion: 1,
            coordinates: { lat: 0, lng: 0, accuracyM: 0, fixType: 'SINGLE' },
            orientation: 0,
            slope: 0,
            aspect: 'N',
            habitatType: 'General',
            images: [],
            status: 'PLANNED',
            surveyors: [],
            surveyDate: new Date().toISOString().split('T')[0],
            customAttributes: {},
            createdAt: now,
            updatedAt: now,
            syncStatus: 'LOCAL_ONLY',
        });

        // Initialize Sampling Units (Standard 4 Quadrants)
        const samplingUnits = ['q1', 'q2', 'q3', 'q4'];
        for (const suId of samplingUnits) {
            await db.samplingUnits.add({
                id: uuidv4(),
                projectId,
                moduleId: 'vegetation',
                plotId: id,
                samplingUnitId: suId,
                status: 'NOT_STARTED',
                createdAt: now,
                lastUpdatedAt: now
            });
        }

        setIsNewPlotModalOpen(false);
        setNewPlotName('');
    };

    return (
        <div className="h-full flex flex-col relative bg-app">
            {/* Toolbar */}
            <div className="flex justify-between items-center mb-6 px-1">
                <div className="flex bg-panel border border-border rounded-xl p-1">
                    <button
                        onClick={() => setViewMode('LIST')}
                        className={clsx(
                            "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all",
                            viewMode === 'LIST'
                                ? "bg-panel-soft text-primary shadow-sm"
                                : "text-text-muted hover:text-text-main"
                        )}
                    >
                        <Table className="w-4 h-4" /> Grid
                    </button>
                    <button
                        onClick={() => setViewMode('MAP')}
                        className={clsx(
                            "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all",
                            viewMode === 'MAP'
                                ? "bg-panel-soft text-primary shadow-sm"
                                : "text-text-muted hover:text-text-main"
                        )}
                    >
                        <MapIcon className="w-4 h-4" /> Map
                    </button>
                </div>

                <button
                    onClick={() => setIsNewPlotModalOpen(true)}
                    className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-app px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg shadow-primary/20"
                >
                    <Plus className="w-4 h-4" /> New Plot
                </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {plots.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-text-muted border-2 border-dashed border-border rounded-2xl bg-panel/30">
                        <Target className="w-12 h-12 mb-4 opacity-20" />
                        <p className="text-sm font-medium">No plots established in this sector.</p>
                    </div>
                ) : viewMode === 'LIST' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 pb-20">
                        {plots.map(plot => (
                            <div
                                key={plot.id}
                                onClick={() => navigate(`/project/${plot.projectId}/module/${plot.moduleId}/plot/${plot.id}`)}
                                className="group bg-panel border border-border hover:border-primary/50 rounded-2xl p-5 cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 relative overflow-hidden"
                            >
                                {/* Hover Gradient */}
                                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                                <div className="relative z-10">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-panel-soft flex items-center justify-center text-primary border border-border group-hover:border-primary/30 transition-colors">
                                                <Target size={20} />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-text-main group-hover:text-primary transition-colors">{plot.name}</h3>
                                                <div className="text-[10px] font-mono text-text-muted">{plot.code}</div>
                                            </div>
                                        </div>

                                        <div className={clsx(
                                            "px-2 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider border",
                                            plot.status === 'COMPLETED' ? "bg-success/10 text-success border-success/20" :
                                                plot.status === 'IN_PROGRESS' ? "bg-warning/10 text-warning border-warning/20" :
                                                    "bg-panel-soft text-text-muted border-border"
                                        )}>
                                            {plot.status.replace('_', ' ')}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 text-xs text-text-muted mb-4">
                                        <div className="flex items-center gap-2">
                                            <Calendar size={14} className="opacity-70" />
                                            <span>{plot.surveyDate}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <MapIcon size={14} className="opacity-70" />
                                            <span>{plot.coordinates.lat.toFixed(4)}, {plot.coordinates.lng.toFixed(4)}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-end text-primary text-xs font-bold gap-1 opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-2 group-hover:translate-x-0">
                                        Open Visualizer <ArrowRight size={14} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex items-center justify-center h-full bg-panel border border-border rounded-2xl">
                        <p className="text-text-muted flex items-center gap-2">
                            <MapIcon className="w-5 h-5" /> GIS Visualization Module Loading...
                        </p>
                    </div>
                )}
            </div>

            {/* New Plot Modal Overlay */}
            {isNewPlotModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-panel border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl animate-in zoom-in-95">
                        <h3 className="text-lg font-bold text-text-main mb-4">Initialize Plot</h3>
                        <input
                            type="text"
                            placeholder="Plot Name (e.g., P-101)"
                            value={newPlotName}
                            onChange={(e) => setNewPlotName(e.target.value)}
                            className="w-full bg-panel-soft border border-border rounded-xl px-4 py-3 text-text-main mb-6 focus:border-primary outline-none transition-colors"
                            autoFocus
                        />
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setIsNewPlotModalOpen(false)}
                                className="px-4 py-2 text-text-muted hover:text-text-main transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreatePlot}
                                disabled={!newPlotName.trim()}
                                className="px-6 py-2 bg-primary text-app rounded-xl font-bold hover:bg-primary/90 disabled:opacity-50 transition"
                            >
                                Create
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};