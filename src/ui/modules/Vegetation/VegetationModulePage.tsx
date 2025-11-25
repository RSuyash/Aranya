import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../../core/data-model/dexie';
import type { Plot, VegetationModule } from '../../../core/data-model/types';
import { Plus, Map, ArrowRight, Calendar, User, X, ArrowLeft, MapPin, Trash2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { BlueprintRegistry, STD_10x10_QUADRANTS } from '../../../core/plot-engine/blueprints';
import { generateLayout } from '../../../core/plot-engine/generateLayout';
import type { PlotNodeInstance } from '../../../core/plot-engine/types';
import { clsx } from 'clsx';

export const VegetationModulePage: React.FC = () => {
    const { projectId, moduleId } = useParams<{ projectId: string; moduleId: string }>();
    const navigate = useNavigate();
    const [isNewPlotOpen, setIsNewPlotOpen] = useState(false);
    const [newPlotName, setNewPlotName] = useState('');
    const [newPlotCode, setNewPlotCode] = useState('');

    const moduleData = useLiveQuery(
        () => moduleId ? db.modules.get(moduleId) : undefined,
        [moduleId]
    );

    const plots = useLiveQuery(
        () => moduleId ? db.plots.where('moduleId').equals(moduleId).toArray() : [],
        [moduleId]
    ) || [];

    const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number; acc: number } | null>(null);
    const [isGettingGps, setIsGettingGps] = useState(false);

    const handleGetGps = () => {
        setIsGettingGps(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setGpsCoords({
                    lat: pos.coords.latitude,
                    lng: pos.coords.longitude,
                    acc: pos.coords.accuracy
                });
                setIsGettingGps(false);
            },
            (err) => {
                console.error(err);
                alert("Failed to get GPS location. Ensure permissions are granted.");
                setIsGettingGps(false);
            },
            { enableHighAccuracy: true }
        );
    };

    const handleCreatePlot = async () => {
        if (!projectId || !moduleId || !newPlotName || !newPlotCode || !moduleData) return;

        const id = uuidv4();
        const now = Date.now();

        const vegModule = moduleData as VegetationModule;
        const blueprintId = vegModule.defaultBlueprintId || STD_10x10_QUADRANTS.id;
        const blueprint = BlueprintRegistry.get(blueprintId) || STD_10x10_QUADRANTS;

        const newPlot: Plot = {
            id,
            projectId,
            moduleId,
            blueprintId: blueprint.id,
            blueprintVersion: blueprint.version,
            name: newPlotName,
            code: newPlotCode,
            coordinates: {
                lat: gpsCoords?.lat || 0,
                lng: gpsCoords?.lng || 0,
                accuracyM: gpsCoords?.acc || 0
            },
            orientation: 0,
            slope: 0,
            aspect: 'N',
            habitatType: 'Forest',
            images: [],
            status: 'PLANNED',
            surveyors: [],
            surveyDate: new Date().toISOString().split('T')[0],
            customAttributes: {},
            createdAt: now,
            updatedAt: now
        };

        await db.plots.add(newPlot);

        // Initialize sampling units from blueprint layout
        const layout = generateLayout(blueprint, undefined, newPlot.id);
        const collectSamplingUnits = (node: PlotNodeInstance): string[] => {
            const units: string[] = [];
            if (node.type === 'SAMPLING_UNIT') {
                units.push(node.id);
            }
            node.children.forEach(child => {
                units.push(...collectSamplingUnits(child));
            });
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
        setGpsCoords(null);
        navigate(`/project/${projectId}/module/${moduleId}/plot/${id}`);
    };

    const handleDeletePlot = async (e: React.MouseEvent, plotId: string) => {
        e.stopPropagation();
        if (confirm("Are you sure you want to delete this plot and all its trees?")) {
            await db.transaction('rw', [db.plots, db.treeObservations, db.vegetationObservations, db.samplingUnits], async () => {
                await db.plots.delete(plotId);
                await db.treeObservations.where('plotId').equals(plotId).delete();
                await db.vegetationObservations.where('plotId').equals(plotId).delete();
                await db.samplingUnits.where('plotId').equals(plotId).delete();
            });
        }
    };

    if (!moduleData) return <div className="p-8 text-white">Loading Module...</div>;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(`/projects/${projectId}`)}
                        className="w-8 h-8 rounded-full bg-[#11182b] border border-[#1d2440] flex items-center justify-center text-[#9ba2c0] hover:text-[#f5f7ff] hover:border-[#56ccf2] transition"
                    >
                        <ArrowLeft className="w-4 h-4" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-[#f5f7ff]">{moduleData.name}</h1>
                        <p className="text-[#9ba2c0] text-sm mt-1">
                            {moduleData.type === 'VEGETATION_PLOTS' ? 'Vegetation Survey' : moduleData.type}
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => setIsNewPlotOpen(true)}
                    className="inline-flex items-center gap-2 bg-[#52d273] text-[#050814] px-4 py-2 rounded-lg font-medium hover:bg-[#45c165] transition"
                >
                    <Plus className="w-4 h-4" />
                    New Plot
                </button>
            </div>

            {/* Plots Grid */}
            {plots.length === 0 ? (
                <div className="bg-[#0b1020] border border-[#1d2440] rounded-xl p-12 text-center">
                    <div className="w-16 h-16 bg-[#11182b] rounded-full flex items-center justify-center mx-auto mb-4">
                        <Map className="w-8 h-8 text-[#9ba2c0]" />
                    </div>
                    <h3 className="text-lg font-medium text-[#f5f7ff] mb-2">No plots yet</h3>
                    <p className="text-[#9ba2c0] mb-6 max-w-md mx-auto">
                        Create your first plot to start collecting vegetation data.
                    </p>
                    <button
                        onClick={() => setIsNewPlotOpen(true)}
                        className="inline-flex items-center gap-2 bg-[#11182b] border border-[#1d2440] text-[#f5f7ff] px-4 py-2 rounded-lg hover:bg-[#161d33] transition"
                    >
                        <Plus className="w-4 h-4" />
                        Create Plot
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {plots.map((plot: Plot) => (
                        <div
                            key={plot.id}
                            onClick={() => navigate(`/project/${projectId}/module/${moduleId}/plot/${plot.id}`)}
                            className="bg-[#0b1020] border border-[#1d2440] rounded-xl p-4 hover:border-[#52d273]/50 transition cursor-pointer group relative"
                        >
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-lg bg-[#11182b] flex items-center justify-center text-[#56ccf2]">
                                        <Map className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-[#f5f7ff] group-hover:text-[#52d273] transition">
                                            {plot.name}
                                        </h3>
                                        <span className="text-xs text-[#9ba2c0]">{plot.code}</span>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] border ${plot.status === 'COMPLETED' ? 'bg-[#0b2214] text-[#52d273] border-[#21452b]' :
                                        plot.status === 'IN_PROGRESS' ? 'bg-[#071824] text-[#56ccf2] border-[#15324b]' :
                                            'bg-[#11182b] text-[#9ba2c0] border-[#1d2440]'
                                        }`}>
                                        {plot.status.replace('_', ' ')}
                                    </span>
                                    <button
                                        onClick={(e) => handleDeletePlot(e, plot.id)}
                                        className="text-[#9ba2c0] hover:text-[#ff7e67] transition p-1"
                                        title="Delete Plot"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2 text-xs text-[#9ba2c0]">
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-3.5 h-3.5" />
                                    <span>{plot.surveyDate}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <User className="w-3.5 h-3.5" />
                                    <span>{plot.surveyors.length > 0 ? plot.surveyors.join(', ') : 'Unassigned'}</span>
                                </div>
                            </div>

                            <div className="mt-4 pt-3 border-t border-[#1d2440] flex justify-between items-center">
                                <span className="text-[10px] text-[#555b75]">
                                    {plot.blueprintId} v{plot.blueprintVersion}
                                </span>
                                <ArrowRight className="w-4 h-4 text-[#52d273] opacity-0 group-hover:opacity-100 transform translate-x-[-4px] group-hover:translate-x-0 transition" />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* New Plot Dialog */}
            {isNewPlotOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-[#0b1020] border border-[#1d2440] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
                        <div className="px-6 py-4 border-b border-[#1d2440] flex items-center justify-between bg-[#050814]">
                            <h3 className="text-lg font-semibold text-[#f5f7ff]">New Plot</h3>
                            <button
                                onClick={() => setIsNewPlotOpen(false)}
                                className="text-[#9ba2c0] hover:text-[#f5f7ff] transition"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-[#9ba2c0] mb-1.5 uppercase tracking-wide">
                                    Plot Name
                                </label>
                                <input
                                    type="text"
                                    value={newPlotName}
                                    onChange={(e) => setNewPlotName(e.target.value)}
                                    placeholder="e.g. North Slope Plot 1"
                                    className="w-full bg-[#050814] border border-[#1d2440] rounded-lg px-4 py-2.5 text-[#f5f7ff] placeholder-[#555b75] focus:outline-none focus:border-[#56ccf2] transition"
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-[#9ba2c0] mb-1.5 uppercase tracking-wide">
                                    Plot Code
                                </label>
                                <input
                                    type="text"
                                    value={newPlotCode}
                                    onChange={(e) => setNewPlotCode(e.target.value)}
                                    placeholder="e.g. P-101"
                                    className="w-full bg-[#050814] border border-[#1d2440] rounded-lg px-4 py-2.5 text-[#f5f7ff] placeholder-[#555b75] focus:outline-none focus:border-[#56ccf2] transition"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-[#9ba2c0] mb-1.5 uppercase tracking-wide">
                                    Location
                                </label>
                                <button
                                    onClick={handleGetGps}
                                    disabled={isGettingGps}
                                    className={clsx(
                                        "w-full border rounded-lg px-4 py-2.5 flex items-center justify-center gap-2 transition",
                                        gpsCoords
                                            ? "bg-[#0b2214] border-[#21452b] text-[#52d273]"
                                            : "bg-[#11182b] border-[#1d2440] text-[#9ba2c0] hover:text-[#f5f7ff]"
                                    )}
                                >
                                    <MapPin className={clsx("w-4 h-4", isGettingGps && "animate-pulse")} />
                                    {isGettingGps ? "Acquiring GPS..." : gpsCoords ? `Lat: ${gpsCoords.lat.toFixed(5)}, Lng: ${gpsCoords.lng.toFixed(5)}` : "Get GPS Location"}
                                </button>
                            </div>

                            <div className="pt-2">
                                <button
                                    onClick={handleCreatePlot}
                                    disabled={!newPlotName || !newPlotCode}
                                    className="w-full bg-[#56ccf2] text-[#050814] font-semibold py-3 rounded-xl hover:bg-[#4ab8de] disabled:opacity-50 disabled:cursor-not-allowed transition"
                                >
                                    Create & Start Survey
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};