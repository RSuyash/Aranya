import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../../core/data-model/dexie';
import {
    MapPin, Sprout, Trees,
    AlignLeft, Globe, Radar
} from 'lucide-react';
import { clsx } from 'clsx';

// --- SUB-COMPONENT: HOLOGRAPHIC METRIC CARD ---
const HoloMetric = ({ label, value, unit, icon: Icon, colorClass, trend }: any) => (
    <div className="relative overflow-hidden rounded-[24px] bg-panel/40 border border-white/5 p-6 flex flex-col justify-between group hover:border-primary/30 transition-all duration-500 hover:shadow-[0_0_40px_-10px_rgba(56,189,248,0.1)] min-h-[160px]">

        {/* Subtle Gradient Backdrop */}
        <div className={clsx("absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 bg-gradient-to-br", colorClass)} style={{ opacity: 0.05 }} />

        <div className="flex justify-between items-start mb-4 relative z-10">
            <div className="p-3 rounded-2xl bg-white/5 border border-white/5 text-text-muted group-hover:text-text-main group-hover:bg-white/10 transition-all duration-300">
                <Icon size={24} strokeWidth={1.5} />
            </div>
            {trend && (
                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-success bg-success/10 px-2.5 py-1 rounded-full border border-success/20">
                    <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" /> {trend}
                </div>
            )}
        </div>

        <div className="relative z-10">
            <div className="text-5xl font-black text-text-main tracking-tighter mb-1">
                {value}
            </div>
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-text-muted/70">
                {label} <span className="text-white/10">/</span> {unit}
            </div>
        </div>
    </div>
);

// --- SUB-COMPONENT: ACTIVITY FEED (Mock Data) ---
const ActivityStream = () => (
    <div className="h-full flex flex-col">
        <div className="flex items-center justify-between mb-8">
            <h3 className="text-sm font-bold text-text-muted uppercase tracking-[0.2em] flex items-center gap-3">
                <AlignLeft size={18} /> Mission Log
            </h3>
            <div className="flex gap-2 items-center px-3 py-1 bg-primary/5 rounded-full border border-primary/10">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                <span className="text-[10px] text-primary font-mono font-bold">LIVE STREAM</span>
            </div>
        </div>

        <div className="flex-1 space-y-6 relative pl-2">
            {/* Timeline Line */}
            <div className="absolute left-[11px] top-2 bottom-2 w-px bg-gradient-to-b from-white/10 via-white/5 to-transparent" />

            {[
                { time: '10:42 AM', user: 'SYSTEM', msg: 'Local database sync completed successfully.', type: 'sys' },
                { time: '09:15 AM', user: 'SURVEYOR-1', msg: 'Data entry: 12 trees added to Plot P-104.', type: 'user' },
                { time: 'YESTERDAY', user: 'SYSTEM', msg: 'Project initialized. Encryption keys generated.', type: 'sys' },
            ].map((log, i) => (
                <div key={i} className="relative pl-8 flex flex-col gap-1 group">
                    {/* Timeline Dot */}
                    <div className={clsx(
                        "absolute left-0 top-1.5 w-[22px] h-[22px] rounded-full border-[3px] border-panel z-10 flex items-center justify-center transition-colors",
                        log.type === 'sys' ? "bg-panel-soft" : "bg-primary"
                    )}>
                        <div className={clsx("w-1.5 h-1.5 rounded-full", log.type === 'sys' ? "bg-text-muted" : "bg-app")} />
                    </div>

                    <div className="flex items-baseline justify-between mb-0.5">
                        <span className={clsx("text-xs font-bold tracking-wide", log.type === 'user' ? "text-primary" : "text-text-main")}>
                            {log.user}
                        </span>
                        <span className="text-[10px] font-mono text-text-muted opacity-60">{log.time}</span>
                    </div>
                    <p className="text-xs text-text-muted leading-relaxed group-hover:text-text-main transition-colors font-medium">
                        {log.msg}
                    </p>
                </div>
            ))}
        </div>
    </div>
);

// --- SUB-COMPONENT: SPATIAL PREVIEW ---
const SpatialRadar = () => (
    <div className="h-full flex flex-col relative overflow-hidden">
        <div className="flex items-center justify-between mb-6 relative z-10">
            <h3 className="text-sm font-bold text-text-muted uppercase tracking-[0.2em] flex items-center gap-3">
                <Globe size={18} /> Geo-Spatial
            </h3>
            <div className="text-[9px] font-bold text-warning bg-warning/10 px-2 py-1 rounded border border-warning/20">
                OFFLINE
            </div>
        </div>

        <div className="flex-1 relative flex items-center justify-center border border-white/5 rounded-2xl bg-black/20 overflow-hidden group">
            {/* Grid Texture */}
            <div className="absolute inset-0 opacity-20"
                style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '40px 40px' }}
            />

            {/* Radar Sweep Effect */}
            <div className="absolute inset-0 rounded-full border border-primary/20 scale-[0.8] opacity-20" />
            <div className="absolute inset-0 rounded-full border border-primary/20 scale-[0.5] opacity-20" />

            <div className="text-center relative z-10">
                <div className="w-16 h-16 mx-auto mb-3 text-primary/20 group-hover:text-primary transition-colors duration-500">
                    <Radar size={64} strokeWidth={1} />
                </div>
                <p className="text-[10px] font-mono text-primary/60 tracking-widest animate-pulse">
                    NO SPATIAL DATA
                </p>
            </div>
        </div>
    </div>
);

// --- MAIN COMPONENT ---
export const ProjectOverview: React.FC<{ projectId: string }> = ({ projectId }) => {
    // Live Data Query
    const stats = useLiveQuery(async () => {
        const [plots, trees, veg] = await Promise.all([
            db.plots.where('projectId').equals(projectId).count(),
            db.treeObservations.where('projectId').equals(projectId).count(),
            db.vegetationObservations.where('projectId').equals(projectId).count()
        ]);
        return { plots, trees, veg };
    }, [projectId]);

    const safeStats = stats || { plots: 0, trees: 0, veg: 0 };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">

            {/* --- SECTION 1: TELEMETRY DECK --- */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <HoloMetric
                    label="Active Plots"
                    value={safeStats.plots}
                    unit="UNITS"
                    icon={MapPin}
                    colorClass="from-blue-500/20 to-cyan-500/20"
                    trend={safeStats.plots > 0 ? "ONLINE" : undefined}
                />
                <HoloMetric
                    label="Biomass Records"
                    value={safeStats.trees}
                    unit="ENTRIES"
                    icon={Trees}
                    colorClass="from-emerald-500/20 to-green-500/20"
                />
                <HoloMetric
                    label="Ground Flora"
                    value={safeStats.veg}
                    unit="OBS"
                    icon={Sprout}
                    colorClass="from-amber-500/20 to-orange-500/20"
                />
            </div>

            {/* --- SECTION 2: INTEL GRID --- */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Activity Feed (2/3 width) */}
                <div className="lg:col-span-2 bg-panel/40 backdrop-blur-md border border-white/5 rounded-[32px] p-8 hover:border-white/10 transition-colors min-h-[400px]">
                    <ActivityStream />
                </div>

                {/* Spatial Map (1/3 width) */}
                <div className="bg-panel/40 backdrop-blur-md border border-white/5 rounded-[32px] p-8 hover:border-white/10 transition-colors min-h-[400px]">
                    <SpatialRadar />
                </div>
            </div>
        </div>
    );
};