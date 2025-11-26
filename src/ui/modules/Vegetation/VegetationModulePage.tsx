import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../../core/data-model/dexie';
import type { Plot } from '../../../core/data-model/types';
import { Plus, Map as MapIcon, ArrowLeft, MapPin, CheckCircle, Loader2, Calendar, X } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { generateDynamicLayout } from '../../../core/plot-engine/dynamicGenerator';
import type { PlotNodeInstance, PlotConfiguration } from '../../../core/plot-engine/types';
import { clsx } from 'clsx';
import { PlotConfigurator } from './ui/PlotConfigurator';
import { LiveTrackOverlay } from '../../../components/ui/LiveTrackOverlay';
import { gpsManager } from '../../../utils/gps/GPSManager';

export const VegetationModulePage: React.FC = () => {
    const { projectId, moduleId } = useParams<{ projectId: string; moduleId: string }>();
    const navigate = useNavigate();
    const [isNewPlotOpen, setIsNewPlotOpen] = useState(false);

    // Simple Form State
    const [newPlotName, setNewPlotName] = useState('');
    const [newPlotCode, setNewPlotCode] = useState('');
    const [plotConfig, setPlotConfig] = useState<PlotConfiguration | null>(null);

    // GPS State (Inline)
    const [liveLocation, setLiveLocation] = useState<{ lat: number; lng: number; accuracy: number; samples: number } | null>(null);

    const moduleData = useLiveQuery(
        () => moduleId ? db.modules.get(moduleId) : undefined,
        [moduleId]
    );

    const plots = useLiveQuery(
        () => moduleId ? db.plots.where('moduleId').equals(moduleId).toArray() : [],
        [moduleId]
    ) || [];

    // --- GPS Logic for New Plot ---
    useEffect(() => {
        if (isNewPlotOpen) {
            // 1. Start high-precision mode immediately when form opens
            gpsManager.startMeasuring();

            // 2. Subscribe to live updates
            const unsubscribe = gpsManager.subscribe((state) => {
                if (state.mode === 'MEASURING' && state.currentResult) {
                    setLiveLocation(state.currentResult);
                }
            });

            return () => {
                unsubscribe();
                // 3. Stop measuring when form closes (save battery)
                gpsManager.stopMeasuring();
            };
        }
    }, [isNewPlotOpen]);

    const handleCreatePlot = async () => {
        if (!projectId || !moduleId || !newPlotName || !newPlotCode || !moduleData || !plotConfig) return;

        const id = uuidv4();
        const now = Date.now();

        // Use the best location we have
        const finalLocation = liveLocation || { lat: 0, lng: 0, accuracy: 0, samples: 0 };

        const newPlot: Plot = {
            id,
            projectId,
            moduleId,
            blueprintId: 'dynamic',
            blueprintVersion: 1,
            configuration: plotConfig,
            name: newPlotName,
            code: newPlotCode,
            coordinates: {
                lat: finalLocation.lat,
                lng: finalLocation.lng,
                accuracyM: finalLocation.accuracy,
                fixType: finalLocation.samples > 10 ? 'AVERAGED' : 'SINGLE',
                sampleCount: finalLocation.samples,
                durationSec: finalLocation.samples, // Approx 1 sec per sample
                timestamp: now
            },
            orientation: 0,
            slope: 0,
            aspect: 'N',
            habitatType: 'Forest',
            images: [],
            status: 'PLANNED',
            surveyors: [], // TODO: Add current user
            surveyDate: new Date().toISOString().split('T')[0],
            customAttributes: {},
            createdAt: now,
            updatedAt: now
        };

        await db.plots.add(newPlot);

        // Initialize sampling units
        const layout = generateDynamicLayout(plotConfig, newPlot.id);
        const collectSamplingUnits = (node: PlotNodeInstance): string[] => {
            const units: string[] = [];
            if (node.type === 'SAMPLING_UNIT') units.push(node.id);
            node.children.forEach(child => units.push(...collectSamplingUnits(child)));
            return units;
        };

        const samplingUnitIds = collectSamplingUnits(layout);

        for (const samplingUnitId of samplingUnitIds) {
            await db.samplingUnits.add({
                id: uuidv4(),
                projectId,
                moduleId,
                plotId: newPlot.id,
                samplingUnitId,
                status: 'NOT_STARTED',
                createdAt: now,
                lastUpdatedAt: now
            });
        }

        setIsNewPlotOpen(false);
        setNewPlotName('');
        setNewPlotCode('');
        setLiveLocation(null);
        navigate(`/project/${projectId}/module/${moduleId}/plot/${id}`);
    };

    if (!moduleData) return <div className="p-8 text-white">Loading Module...</div>;

    return (
        <div className="space-y-6 pb-24">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(`/projects/${projectId}`)}
                        className="w-10 h-10 rounded-full bg-[#11182b] border border-[#1d2440] flex items-center justify-center text-[#9ba2c0] hover:text-[#f5f7ff] hover:border-[#56ccf2] transition"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-[#f5f7ff]">{moduleData.name}</h1>
                        <p className="text-[#9ba2c0] text-sm mt-1">
                            Field Data Collection
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => setIsNewPlotOpen(true)}
                    className="flex items-center gap-2 bg-[#52d273] text-[#050814] px-4 py-2.5 rounded-xl font-bold hover:bg-[#45c165] transition shadow-lg shadow-[#52d273]/20"
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
                <div className="bg-[#0b1020] border border-[#1d2440] rounded-2xl p-12 text-center mt-8">
                    <div className="w-16 h-16 bg-[#11182b] rounded-full flex items-center justify-center mx-auto mb-4 border border-[#1d2440]">
                        <MapIcon className="w-8 h-8 text-[#555b75]" />
                    </div>
                    <h3 className="text-lg font-bold text-[#f5f7ff] mb-2">No plots established</h3>
                    <p className="text-[#9ba2c0] mb-6 max-w-md mx-auto">
                        Start by creating a new plot at your current location.
                    </p>
                    <button
                        onClick={() => setIsNewPlotOpen(true)}
                        className="inline-flex items-center gap-2 bg-[#11182b] border border-[#56ccf2] text-[#56ccf2] px-6 py-3 rounded-xl font-medium hover:bg-[#56ccf2] hover:text-[#050814] transition"
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
                            className="bg-[#0b1020] border border-[#1d2440] rounded-2xl p-5 hover:border-[#56ccf2] transition cursor-pointer group relative overflow-hidden"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-lg font-bold text-[#f5f7ff] group-hover:text-[#56ccf2] transition">
                                        {plot.name}
                                    </h3>
                                    <span className="text-xs font-mono text-[#9ba2c0] bg-[#11182b] px-2 py-0.5 rounded border border-[#1d2440]">
                                        {plot.code}
                                    </span>
                                </div>
                                <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${plot.status === 'COMPLETED' ? 'bg-[#0b2214] text-[#52d273] border-[#21452b]' :
                                    plot.status === 'IN_PROGRESS' ? 'bg-[#071824] text-[#56ccf2] border-[#15324b]' :
                                        'bg-[#1d2440] text-[#9ba2c0] border-[#2d3855]'
                                    }`}>
                                    {plot.status.replace('_', ' ')}
                                </span>
                            </div>

                            <div className="flex items-center gap-4 text-xs text-[#9ba2c0]">
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

            {/* New Plot Bottom Sheet (Mobile Friendly) */}
            {isNewPlotOpen && (
                <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/80 backdrop-blur-sm p-0 md:p-4 animate-in fade-in duration-200">
                    <div className="bg-[#0b1020] border-t md:border border-[#1d2440] rounded-t-2xl md:rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom duration-300">

                        {/* Header */}
                        <div className="px-6 py-4 border-b border-[#1d2440] flex items-center justify-between bg-[#050814] sticky top-0 z-10">
                            <h3 className="text-lg font-bold text-[#f5f7ff]">Establish New Plot</h3>
                            <button onClick={() => setIsNewPlotOpen(false)} className="p-2 hover:bg-[#1d2440] rounded-full transition">
                                <X className="w-5 h-5 text-[#9ba2c0]" />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* 1. Live GPS Status - The "Simple" Part */}
                            <div className={clsx(
                                "rounded-xl p-4 border transition-colors",
                                !liveLocation ? "bg-[#11182b] border-[#1d2440]" :
                                    liveLocation.accuracy <= 5 ? "bg-[#0b2214] border-[#21452b]" : "bg-[#3a2e10] border-[#f2c94c]/30"
                            )}>
                                <div className="flex items-start justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <MapPin className={clsx("w-5 h-5", liveLocation && liveLocation.accuracy <= 5 ? "text-[#52d273]" : "text-[#f2c94c]")} />
                                        <span className="text-sm font-bold text-[#f5f7ff]">Plot Location</span>
                                    </div>
                                    {liveLocation ? (
                                        <div className={clsx("text-[10px] font-bold px-2 py-0.5 rounded-full uppercase",
                                            liveLocation.accuracy <= 5 ? "bg-[#52d273]/20 text-[#52d273]" : "bg-[#f2c94c]/20 text-[#f2c94c]"
                                        )}>
                                            {liveLocation.accuracy <= 5 ? "Strong Signal" : "Improving..."}
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 text-[10px] text-[#56ccf2]">
                                            <Loader2 className="w-3 h-3 animate-spin" /> Acquiring Satellites...
                                        </div>
                                    )}
                                </div>

                                {liveLocation ? (
                                    <div className="font-mono text-2xl text-[#f5f7ff] tracking-tight">
                                        {liveLocation.lat.toFixed(6)}, {liveLocation.lng.toFixed(6)}
                                        <div className="text-xs font-sans text-[#9ba2c0] mt-1 flex gap-3">
                                            <span>Error: ±{liveLocation.accuracy.toFixed(1)}m</span>
                                            <span>Samples: {liveLocation.samples}</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="h-8 w-3/4 bg-[#1d2440] rounded animate-pulse" />
                                )}
                            </div>

                            {/* 2. Basic Info */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-[#9ba2c0] mb-1.5 uppercase">Name</label>
                                    <input
                                        type="text"
                                        value={newPlotName}
                                        onChange={(e) => setNewPlotName(e.target.value)}
                                        placeholder="e.g. Ridge Plot 1"
                                        className="w-full bg-[#050814] border border-[#1d2440] rounded-xl px-4 py-3 text-[#f5f7ff] focus:border-[#56ccf2] outline-none"
                                        autoFocus
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-[#9ba2c0] mb-1.5 uppercase">Code</label>
                                    <input
                                        type="text"
                                        value={newPlotCode}
                                        onChange={(e) => setNewPlotCode(e.target.value)}
                                        placeholder="e.g. P-01"
                                        className="w-full bg-[#050814] border border-[#1d2440] rounded-xl px-4 py-3 text-[#f5f7ff] focus:border-[#56ccf2] outline-none"
                                    />
                                </div>
                            </div>

                            {/* 3. Layout Config */}
                            <PlotConfigurator onChange={setPlotConfig} />

                            {/* Action */}
                            <button
                                onClick={handleCreatePlot}
                                disabled={!newPlotName || !newPlotCode || !plotConfig || !liveLocation}
                                className="w-full bg-[#56ccf2] text-[#050814] font-bold py-4 rounded-xl hover:bg-[#4ab8de] disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2 text-lg"
                            >
                                {liveLocation ? <CheckCircle className="w-5 h-5" /> : <Loader2 className="w-5 h-5 animate-spin" />}
                                {liveLocation ? "Create Plot" : "Waiting for GPS..."}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};