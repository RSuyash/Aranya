import React, { useState, useEffect } from 'react';
import { db } from '../../../core/data-model/dexie';
import type { Plot } from '../../../core/data-model/types';
import { X, Save, MapPin, Mountain, Trees, Layers } from 'lucide-react';

interface PlotDetailsPanelProps {
    plotId: string;
    onClose: () => void;
}

export const PlotDetailsPanel: React.FC<PlotDetailsPanelProps> = ({ plotId, onClose }) => {
    const [formData, setFormData] = useState<Partial<Plot>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const loadPlot = async () => {
            const plot = await db.plots.get(plotId);
            if (plot) {
                setFormData(plot);
            }
            setLoading(false);
        };
        loadPlot();
    }, [plotId]);

    const handleSave = async () => {
        setSaving(true);
        try {
            if (formData.id) {
                await db.plots.update(formData.id, {
                    ...formData,
                    updatedAt: Date.now(),
                    syncStatus: 'DIRTY' // Mark for sync
                });
                onClose();
            }
        } catch (error) {
            console.error("Failed to save plot details:", error);
            alert("Failed to save changes.");
        } finally {
            setSaving(false);
        }
    };

    const updateCoordinate = (key: keyof Plot['coordinates'], value: number) => {
        setFormData(prev => ({
            ...prev,
            coordinates: {
                ...prev.coordinates!,
                [key]: value
            }
        }));
    };

    const updateGroundCover = (key: keyof NonNullable<Plot['groundCover']>, value: number) => {
        setFormData(prev => ({
            ...prev,
            groundCover: {
                rockPercent: 0,
                bareSoilPercent: 0,
                litterPercent: 0,
                vegetationPercent: 0,
                ...prev.groundCover,
                [key]: value
            }
        }));
    };

    if (loading) return <div className="p-8 text-text-muted">Loading details...</div>;

    return (
        <div className="h-full flex flex-col bg-panel text-text-main overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-border flex items-center justify-between shrink-0 bg-app">
                <h2 className="text-lg font-bold flex items-center gap-2">
                    Plot Details
                    <span className="px-2 py-0.5 rounded-full bg-panel-soft border border-border text-[10px] text-text-muted font-normal">
                        {formData.code}
                    </span>
                </h2>
                <button onClick={onClose} className="text-text-muted hover:text-text-main transition">
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* Scrollable Form Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">

                {/* Section: Location */}
                <section className="space-y-4">
                    <div className="flex items-center gap-2 text-primary border-b border-border pb-2">
                        <MapPin className="w-4 h-4" />
                        <h3 className="text-sm font-semibold uppercase tracking-wider">Location & Geometry</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs text-text-muted mb-1">Latitude</label>
                            <input
                                type="number"
                                step="0.000001"
                                value={formData.coordinates?.lat || 0}
                                onChange={e => updateCoordinate('lat', parseFloat(e.target.value))}
                                className="w-full bg-app border border-border rounded-lg px-3 py-2 text-sm focus:border-primary outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-text-muted mb-1">Longitude</label>
                            <input
                                type="number"
                                step="0.000001"
                                value={formData.coordinates?.lng || 0}
                                onChange={e => updateCoordinate('lng', parseFloat(e.target.value))}
                                className="w-full bg-app border border-border rounded-lg px-3 py-2 text-sm focus:border-primary outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-text-muted mb-1">Altitude (m)</label>
                            <input
                                type="number"
                                value={formData.coordinates?.altitude || 0}
                                onChange={e => updateCoordinate('altitude', parseFloat(e.target.value))}
                                className="w-full bg-app border border-border rounded-lg px-3 py-2 text-sm focus:border-primary outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-text-muted mb-1">GPS Accuracy (m)</label>
                            <input
                                type="number"
                                value={formData.coordinates?.accuracyM || 0}
                                onChange={e => updateCoordinate('accuracyM', parseFloat(e.target.value))}
                                className="w-full bg-app border border-border rounded-lg px-3 py-2 text-sm focus:border-primary outline-none"
                            />
                        </div>
                    </div>
                </section>

                {/* Section: Topography */}
                <section className="space-y-4">
                    <div className="flex items-center gap-2 text-success border-b border-border pb-2">
                        <Mountain className="w-4 h-4" />
                        <h3 className="text-sm font-semibold uppercase tracking-wider">Topography</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs text-text-muted mb-1">Slope (degrees)</label>
                            <input
                                type="number"
                                value={formData.slope || 0}
                                onChange={e => setFormData({ ...formData, slope: parseFloat(e.target.value) })}
                                className="w-full bg-app border border-border rounded-lg px-3 py-2 text-sm focus:border-success outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-text-muted mb-1">Aspect</label>
                            <select
                                value={formData.aspect || 'N'}
                                onChange={e => setFormData({ ...formData, aspect: e.target.value })}
                                className="w-full bg-app border border-border rounded-lg px-3 py-2 text-sm focus:border-success outline-none text-text-main"
                            >
                                {['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'].map(dir => (
                                    <option key={dir} value={dir}>{dir}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs text-text-muted mb-1">Orientation (Azimuth)</label>
                            <input
                                type="number"
                                value={formData.orientation || 0}
                                onChange={e => setFormData({ ...formData, orientation: parseFloat(e.target.value) })}
                                className="w-full bg-app border border-border rounded-lg px-3 py-2 text-sm focus:border-success outline-none"
                            />
                        </div>
                    </div>
                </section>

                {/* Section: Habitat */}
                <section className="space-y-4">
                    <div className="flex items-center gap-2 text-warning border-b border-border pb-2">
                        <Trees className="w-4 h-4" />
                        <h3 className="text-sm font-semibold uppercase tracking-wider">Habitat & Ecology</h3>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs text-text-muted mb-1">Habitat Type</label>
                            <input
                                type="text"
                                value={formData.habitatType || ''}
                                onChange={e => setFormData({ ...formData, habitatType: e.target.value })}
                                placeholder="e.g. Deciduous Forest"
                                className="w-full bg-app border border-border rounded-lg px-3 py-2 text-sm focus:border-warning outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-text-muted mb-1">Disturbance Type</label>
                            <select
                                value={formData.disturbanceType || 'NONE'}
                                onChange={e => setFormData({ ...formData, disturbanceType: e.target.value as any })}
                                className="w-full bg-app border border-border rounded-lg px-3 py-2 text-sm focus:border-warning outline-none text-text-main"
                            >
                                <option value="NONE">None</option>
                                <option value="FIRE">Fire</option>
                                <option value="GRAZING">Grazing</option>
                                <option value="CUTTING">Cutting</option>
                                <option value="OTHER">Other</option>
                            </select>
                        </div>
                    </div>
                </section>

                {/* Section: Ground Cover */}
                <section className="space-y-4">
                    <div className="flex items-center gap-2 text-error border-b border-border pb-2">
                        <Layers className="w-4 h-4" />
                        <h3 className="text-sm font-semibold uppercase tracking-wider">Ground Cover (%)</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        {[
                            { label: 'Rock', key: 'rockPercent' },
                            { label: 'Bare Soil', key: 'bareSoilPercent' },
                            { label: 'Litter', key: 'litterPercent' },
                            { label: 'Vegetation', key: 'vegetationPercent' }
                        ].map(item => (
                            <div key={item.key}>
                                <label className="block text-xs text-text-muted mb-1">{item.label}</label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={formData.groundCover?.[item.key as keyof typeof formData.groundCover] || 0}
                                        onChange={e => updateGroundCover(item.key as any, parseInt(e.target.value))}
                                        className="flex-1 accent-error"
                                    />
                                    <span className="text-xs w-8 text-right">
                                        {formData.groundCover?.[item.key as keyof typeof formData.groundCover] || 0}%
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </div>

            {/* Footer Actions */}
            <div className="p-6 border-t border-border bg-app">
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full flex items-center justify-center gap-2 bg-primary text-app font-bold py-3 rounded-xl hover:bg-primary/90 transition disabled:opacity-50"
                >
                    <Save className="w-4 h-4" />
                    {saving ? 'Saving...' : 'Save Changes'}
                </button>
            </div>
        </div>
    );
};
