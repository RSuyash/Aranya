import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../../core/data-model/dexie';
import type { Plot } from '../../../core/data-model/types';
import { Plus, Map as MapIcon, ArrowLeft, MapPin, Calendar } from 'lucide-react';
import { LiveTrackOverlay } from '../../../components/ui/LiveTrackOverlay';
import { NewPlotWizard } from './components/plot-creation/NewPlotWizard';

export const VegetationModulePage: React.FC = () => {
    const { projectId, moduleId } = useParams<{ projectId: string; moduleId: string }>();
    const navigate = useNavigate();
    const [isNewPlotOpen, setIsNewPlotOpen] = useState(false);

    const moduleData = useLiveQuery(
        () => moduleId ? db.modules.get(moduleId) : undefined,
        [moduleId]
    );

    const plots = useLiveQuery(
        () => moduleId ? db.plots.where('moduleId').equals(moduleId).toArray() : [],
        [moduleId]
    ) || [];

    if (!moduleData) return <div className="p-8 text-white">Loading Module...</div>;

    return (
        <div className="space-y-6 pb-24">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(`/projects/${projectId}`)}
                        className="w-10 h-10 rounded-full bg-panel-soft border border-border flex items-center justify-center text-text-muted hover:text-text-main hover:border-primary transition"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-text-main">{moduleData.name}</h1>
                        <p className="text-text-muted text-sm mt-1">
                            Field Data Collection
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => setIsNewPlotOpen(true)}
                    className="flex items-center gap-2 bg-success text-app px-4 py-2.5 rounded-xl font-bold hover:bg-success/80 transition shadow-lg shadow-success/20"
                >
                    <Plus className="w-5 h-5" />
                    New Plot
                </button>
            </div>

            {/* Patrol/Track Overlay */}
            <LiveTrackOverlay
                projectId={projectId || ''}
                surveyorId="current-user"
                moduleId={moduleId || ''}
            />

            {/* Plots Grid */}
            {plots.length === 0 ? (
                <div className="bg-panel border border-border rounded-2xl p-12 text-center mt-8">
                    <div className="w-16 h-16 bg-panel-soft rounded-full flex items-center justify-center mx-auto mb-4 border border-border">
                        <MapIcon className="w-8 h-8 text-text-muted" />
                    </div>
                    <h3 className="text-lg font-bold text-text-main mb-2">No plots established</h3>
                    <p className="text-text-muted mb-6 max-w-md mx-auto">
                        Start by creating a new plot at your current location.
                    </p>
                    <button
                        onClick={() => setIsNewPlotOpen(true)}
                        className="inline-flex items-center gap-2 bg-panel-soft border border-primary text-primary px-6 py-3 rounded-xl font-medium hover:bg-primary hover:text-app transition"
                    >
                        <Plus className="w-5 h-5" />
                        Establish First Plot
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {plots.map((plot: Plot) => (
                        <div
                            key={plot.id}
                            onClick={() => navigate(`/project/${projectId}/module/${moduleId}/plot/${plot.id}`)}
                            className="bg-panel border border-border rounded-2xl p-5 hover:border-primary transition cursor-pointer group relative overflow-hidden"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-lg font-bold text-text-main group-hover:text-primary transition">
                                        {plot.name}
                                    </h3>
                                    <span className="text-xs font-mono text-text-muted bg-panel-soft px-2 py-0.5 rounded border border-border">
                                        {plot.code}
                                    </span>
                                </div>
                                <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${plot.status === 'COMPLETED' ? 'bg-success/20 text-success border-success/30' :
                                    plot.status === 'IN_PROGRESS' ? 'bg-primary/10 text-primary border-primary/20' :
                                        'bg-panel-soft text-text-muted border-border'
                                    }`}>
                                    {plot.status.replace('_', ' ')}
                                </span>
                            </div>

                            <div className="flex items-center gap-4 text-xs text-text-muted">
                                <div className="flex items-center gap-1.5">
                                    <Calendar className="w-3.5 h-3.5" />
                                    <span>{plot.surveyDate}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <MapPin className="w-3.5 h-3.5" />
                                    <span>{plot.coordinates.accuracyM < 5 ? 'High Precision' : `±${plot.coordinates.accuracyM.toFixed(0)}m`}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* New Plot Wizard */}
            <NewPlotWizard
                isOpen={isNewPlotOpen}
                onClose={() => setIsNewPlotOpen(false)}
                projectId={projectId || ''}
                moduleId={moduleId || ''}
                moduleData={moduleData}
            />
        </div>
    );
};