import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../core/data-model/dexie';
import {
    Bird, Droplets, Mountain, Database,
    Activity, ArrowUpRight, Zap, Map as MapIcon, Layers,
    FolderOpen, Cpu, Globe, Crosshair
} from 'lucide-react';
import { clsx } from 'clsx';

// --- 1. NEW COMPONENT: THE "CYBER SEPARATOR" ---
// Replaces boring border-b lines with a high-tech divider
const TechSeparator = ({ label, icon: Icon }: { label: string, icon: any }) => (
    <div className="flex items-center gap-4 py-2 mb-4 group select-none">
        <div className="flex items-center gap-2 text-primary/80 group-hover:text-primary transition-colors">
            <Icon size={16} strokeWidth={2.5} />
            <span className="text-xs font-bold uppercase tracking-[0.15em] whitespace-nowrap">
                {label}
            </span>
        </div>

        {/* The Line Graphic */}
        <div className="relative flex-1 h-px bg-gradient-to-r from-primary/50 via-border to-transparent">
            {/* The "Circuit Node" Dot */}
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-1 bg-primary shadow-[0_0_8px_var(--primary)] rounded-full" />
            {/* The "Data Tick" */}
            <div className="absolute left-10 top-1/2 -translate-y-1/2 w-8 h-px bg-primary/50" />
        </div>
    </div>
);

// --- 2. IMPROVED STAT CARD (Holographic Look) ---
const GraphicalMetric = ({ label, value, subLabel, icon: Icon, color, percent }: any) => (
    <div className="relative overflow-hidden rounded-2xl bg-panel/40 backdrop-blur-xl border border-white/5 p-5 flex items-center justify-between group hover:border-primary/30 transition-all duration-500 hover:shadow-[0_0_30px_-10px_rgba(56,189,248,0.15)] hover:-translate-y-1 cursor-default">

        {/* Subtle Background Gradient */}
        <div className={clsx("absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500 bg-gradient-to-br", color.gradient)} />

        <div className="flex flex-col z-10 relative">
            <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-2 group-hover:text-text-main transition-colors">{label}</span>
            <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black text-text-main tracking-tighter leading-none">{value}</span>
                <span className="text-[10px] font-bold text-text-muted bg-panel-soft px-1.5 py-0.5 rounded border border-white/5">{subLabel}</span>
            </div>

            {/* Tech Progress Bar */}
            <div className="h-1 w-16 bg-white/5 rounded-full mt-3 overflow-hidden">
                <div className={clsx("h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_currentColor]", color.text)} style={{ width: `${percent}%` }} />
            </div>
        </div>

        <div className={clsx("w-12 h-12 rounded-2xl flex items-center justify-center border transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 shadow-lg", color.iconBg, color.border)}>
            <Icon size={24} className={color.text} strokeWidth={1.5} />
        </div>
    </div>
);

// --- 3. ACTIVE MISSION BANNER (Refined) ---
const ActiveMissionBanner = ({ data, onClick }: any) => (
    <div className="relative w-full overflow-hidden rounded-[20px] border border-white/10 bg-panel shadow-2xl group cursor-pointer hover:border-primary/40 transition-colors duration-500">

        {/* Animated Scanner Line (Visual Flair) */}
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-transparent via-primary/5 to-transparent -translate-y-full group-hover:translate-y-full transition-transform duration-[1.5s] ease-in-out" />

        <div className="flex flex-col md:flex-row items-stretch min-h-[260px]">

            {/* Left: The "Engine" */}
            <div className="flex-1 p-8 relative flex flex-col justify-between" onClick={onClick}>
                {/* Tech Pattern Overlay */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
                    style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, var(--text-main) 1px, transparent 0)', backgroundSize: '32px 32px' }}
                />

                <div className="relative z-10 space-y-6">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[9px] font-bold uppercase tracking-[0.2em] animate-pulse">
                        <Activity size={10} /> Live Ops
                    </div>

                    <div>
                        <h2 className="text-4xl md:text-5xl font-black text-text-main tracking-tight mb-2 group-hover:text-primary transition-colors duration-300">
                            Vegetation <span className="font-serif italic text-text-muted font-normal group-hover:text-primary/70">Survey</span>
                        </h2>
                        <p className="text-text-muted max-w-md text-sm leading-relaxed border-l-2 border-primary/30 pl-4">
                            Biomass estimation & carbon stock analysis module.
                        </p>
                    </div>
                </div>

                <div className="relative z-10 flex items-center gap-3 text-sm font-bold text-text-main mt-4">
                    <div className="w-8 h-8 rounded-full bg-primary text-bg-app flex items-center justify-center group-hover:scale-110 transition-transform shadow-[0_0_15px_var(--primary)]">
                        <ArrowUpRight size={18} strokeWidth={3} />
                    </div>
                    <span className="group-hover:translate-x-1 transition-transform">Enter Module</span>
                </div>
            </div>

            {/* Right: The "Dashboard" (Data Density) */}
            <div className="md:w-[300px] contrast-surface backdrop-blur-md p-8 flex flex-col justify-between border-t md:border-t-0 md:border-l border-white/5 relative">

                {/* Saturation Ring */}
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-[9px] font-bold uppercase tracking-[0.1em] text-text-muted">Target Saturation</span>
                        <Crosshair size={14} className="text-warning animate-[spin_10s_linear_infinite]" />
                    </div>

                    <div className="relative">
                        <span className="text-6xl font-black text-text-main tracking-tighter leading-none">
                            {Math.round((data.plots / 150) * 100)}<span className="text-2xl text-text-muted align-top">%</span>
                        </span>
                    </div>

                    {/* Progress Line */}
                    <div className="relative h-1.5 w-full bg-white/5 rounded-full mt-4 overflow-hidden">
                        <div
                            className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-indigo-500 rounded-full transition-all duration-1000 ease-out"
                            style={{ width: `${(data.plots / 150) * 100}%` }}
                        />
                    </div>
                    <div className="flex justify-between mt-2 text-[9px] font-mono text-text-muted uppercase">
                        <span>Current: {data.plots}</span>
                        <span>Goal: 150</span>
                    </div>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-2 gap-px bg-white/10 border border-white/5 rounded-lg overflow-hidden mt-6">
                    <div className="bg-panel/50 p-3 text-center hover:bg-white/5 transition-colors">
                        <div className="text-[9px] text-text-muted uppercase font-bold mb-1">Plots</div>
                        <div className="text-lg font-mono font-bold text-text-main">{data.plots}</div>
                    </div>
                    <div className="bg-panel/50 p-3 text-center hover:bg-white/5 transition-colors">
                        <div className="text-[9px] text-text-muted uppercase font-bold mb-1">Trees</div>
                        <div className="text-lg font-mono font-bold text-text-main">{data.trees}</div>
                    </div>
                </div>
            </div>
        </div>
    </div>
);

// --- 4. INACTIVE MODULE ROW ---
const ModuleRow = ({ title, icon: Icon, status }: any) => (
    <div className="flex items-center justify-between p-4 rounded-xl border border-transparent bg-panel/30 hover:bg-panel hover:border-white/5 transition-all duration-300 cursor-not-allowed group">
        <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-text-muted group-hover:text-text-main transition-colors border border-transparent group-hover:border-white/10">
                <Icon size={18} strokeWidth={2} />
            </div>
            <div>
                <div className="font-bold text-text-main text-sm">{title}</div>
                <div className="text-[9px] font-bold text-text-muted uppercase tracking-wider">{status}</div>
            </div>
        </div>
        <div className="h-1.5 w-1.5 rounded-full bg-white/10 group-hover:bg-primary transition-colors" />
    </div>
);

// --- MAIN LAYOUT ---

export const DashboardPage: React.FC = () => {
    const navigate = useNavigate();

    const data = useLiveQuery(async () => {
        const [proj, plot, tree, veg] = await Promise.all([
            db.projects.count(),
            db.plots.count(),
            db.treeObservations.count(),
            db.vegetationObservations.count()
        ]);
        // Simple distinct species count
        const uniqueSpecies = await db.treeObservations.orderBy('speciesName').uniqueKeys();
        return { projects: proj, plots: plot, trees: tree, species: uniqueSpecies.length, records: tree + veg };
    }, [], { projects: 0, plots: 0, trees: 0, species: 0, records: 0 });

    return (
        <div className="space-y-12 pb-20 animate-in fade-in duration-700">

            {/* --- SECTION 1: HEADER & STATS --- */}
            <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">

                {/* Left: Brand / Context - ALIGNMENT FIXED */}
                <div className="lg:col-span-6 flex flex-col items-start">
                    {/* Status Pill - sits flush left */}
                    <div className="flex items-center gap-2 mb-2 px-0">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
                        </span>
                        <span className="text-[10px] font-bold text-success tracking-[0.2em] uppercase">System Online</span>
                    </div>

                    {/* Main Title - Flush left */}
                    <h1 className="text-6xl font-black text-text-main tracking-tighter leading-none -ml-1">
                        Terra<span className="font-light text-text-muted">OS</span>
                    </h1>
                </div>

                {/* Right: Graphical Metrics */}
                <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <GraphicalMetric
                        label="Projects"
                        value={data.projects.toString().padStart(2, '0')}
                        subLabel="ACTIVE"
                        icon={FolderOpen}
                        percent={75}
                        color={{ gradient: 'from-primary/20 to-blue-500/5', fill: 'bg-primary', text: 'text-primary', iconBg: 'bg-primary/10', border: 'border-primary/20' }}
                    />
                    <GraphicalMetric
                        label="Plots"
                        value={data.plots}
                        subLabel="UNITS"
                        icon={MapIcon}
                        percent={45}
                        color={{ gradient: 'from-indigo-500/20 to-purple-500/5', fill: 'bg-indigo-500', text: 'text-indigo-500', iconBg: 'bg-indigo-500/10', border: 'border-indigo-500/20' }}
                    />
                    <GraphicalMetric
                        label="Records"
                        value={data.records}
                        subLabel="TOTAL"
                        icon={Database}
                        percent={90}
                        color={{ gradient: 'from-emerald-500/20 to-teal-500/5', fill: 'bg-emerald-500', text: 'text-emerald-500', iconBg: 'bg-emerald-500/10', border: 'border-emerald-500/20' }}
                    />
                </div>
            </section>

            {/* --- SECTION 2: WORKSPACE --- */}
            <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* Main Action Area */}
                <div className="lg:col-span-8 space-y-6">
                    {/* The New Tech Separator */}
                    <TechSeparator label="Priority Module" icon={Zap} />

                    <ActiveMissionBanner
                        data={data}
                        onClick={() => navigate('/projects/vegetation')}
                    />

                    {/* Secondary Actions Row */}
                    <div className="grid grid-cols-2 gap-4">
                        <button onClick={() => navigate('/map')} className="group p-6 rounded-[20px] bg-panel/40 border border-white/5 hover:bg-panel hover:border-primary/30 transition-all duration-300 text-left relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-12 bg-primary/5 rounded-full blur-2xl -mr-6 -mt-6 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="mb-4 w-10 h-10 rounded-xl bg-bg-app border border-white/10 flex items-center justify-center text-text-muted group-hover:text-primary group-hover:scale-110 transition-all shadow-inner">
                                <Globe size={20} strokeWidth={2} />
                            </div>
                            <span className="font-bold text-text-main block text-lg group-hover:text-primary transition-colors">Global Map</span>
                            <span className="text-xs text-text-muted mt-1 block">Spatial Visualization</span>
                        </button>

                        <button onClick={() => navigate('/analysis')} className="group p-6 rounded-[20px] bg-panel/40 border border-white/5 hover:bg-panel hover:border-warning/30 transition-all duration-300 text-left relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-12 bg-warning/5 rounded-full blur-2xl -mr-6 -mt-6 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="mb-4 w-10 h-10 rounded-xl bg-bg-app border border-white/10 flex items-center justify-center text-text-muted group-hover:text-warning group-hover:scale-110 transition-all shadow-inner">
                                <Cpu size={20} strokeWidth={2} />
                            </div>
                            <span className="font-bold text-text-main block text-lg group-hover:text-warning transition-colors">Analytics Engine</span>
                            <span className="text-xs text-text-muted mt-1 block">Data Processing</span>
                        </button>
                    </div>
                </div>

                {/* Side Stack */}
                <div className="lg:col-span-4 space-y-6">
                    <TechSeparator label="System Modules" icon={Layers} />

                    <div className="space-y-3">
                        <ModuleRow
                            title="Avian Surveys"
                            icon={Bird}
                            status="Beta Access"
                        />
                        <ModuleRow
                            title="Water Quality"
                            icon={Droplets}
                            status="Coming Soon"
                        />
                        <ModuleRow
                            title="Soil Horizons"
                            icon={Mountain}
                            status="Planned"
                        />
                    </div>

                    {/* Teaser / Info Box */}
                    <div className="mt-8 p-6 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] text-center">
                        <div className="flex justify-center mb-3 text-primary/50">
                            <Activity className="animate-pulse" />
                        </div>
                        <p className="text-xs text-text-muted leading-relaxed">
                            System <span className="font-mono text-primary">v2.4.0</span> is up to date.<br />
                            Next cloud sync scheduled in 10m.
                        </p>
                    </div>
                </div>
            </section>
        </div>
    );
};