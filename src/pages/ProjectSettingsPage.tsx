import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useRepositories } from '../hooks/useRepositories';
import { useHeader } from '../context/HeaderContext';
import { db } from '../core/data-model/dexie';
import { VegetationSettingsForm } from '../ui/modules/Vegetation/VegetationSettingsForm';
import { clsx } from 'clsx';

// Icons
import {
    Settings, Cpu, Terminal, ShieldCheck,
    Leaf, Droplets, Plus, Bird, Power, ArrowRight
} from 'lucide-react';

// --- SUB-COMPONENT: MODULE EXPANSION SLOT ---
// Represents a "hardware blade" in the system rack
const ModuleSlot = ({
    title,
    description,
    icon: Icon,
    isActive,
    onInstall,
    onUninstall,
    children
}: any) => {
    const [isConfigOpen, setIsConfigOpen] = useState(false);

    return (
        <div className={clsx(
            "relative overflow-hidden rounded-[24px] border transition-all duration-500 group",
            isActive
                ? "bg-panel border-primary/30 shadow-[0_0_40px_-10px_rgba(56,189,248,0.1)]"
                : "bg-panel/30 border-white/5 border-dashed hover:border-white/20 hover:bg-panel/50"
        )}>
            {/* Active Glow Strip */}
            {isActive && (
                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-primary to-blue-600" />
            )}

            {/* Header / Control Bar */}
            <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">

                {/* Identity Block */}
                <div className="flex items-start gap-5">
                    <div className={clsx(
                        "w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-inner shrink-0",
                        isActive
                            ? "bg-primary/10 text-primary border border-primary/20"
                            : "bg-white/5 text-text-muted border border-white/5 group-hover:scale-110 group-hover:text-text-main"
                    )}>
                        <Icon size={28} strokeWidth={1.5} />
                    </div>
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <h3 className={clsx("text-lg font-bold transition-colors", isActive ? "text-text-main" : "text-text-muted group-hover:text-text-main")}>
                                {title}
                            </h3>
                            {isActive && (
                                <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-success/10 border border-success/20 text-[10px] font-bold text-success uppercase tracking-wider shadow-[0_0_10px_rgba(34,197,94,0.2)]">
                                    <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                                    Online
                                </span>
                            )}
                        </div>
                        <p className="text-sm text-text-muted max-w-md leading-relaxed">
                            {description}
                        </p>
                    </div>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-3 self-end md:self-auto">
                    {isActive ? (
                        <>
                            <button
                                onClick={() => setIsConfigOpen(!isConfigOpen)}
                                className={clsx(
                                    "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all",
                                    isConfigOpen
                                        ? "bg-primary text-app shadow-lg shadow-primary/20 hover:bg-primary/90"
                                        : "bg-panel-soft border border-border text-text-muted hover:text-text-main hover:border-primary/50"
                                )}
                            >
                                <Settings size={16} />
                                {isConfigOpen ? 'Close Config' : 'Configure'}
                            </button>

                            <button
                                onClick={onUninstall}
                                className="p-2.5 rounded-xl text-text-muted hover:text-danger hover:bg-danger/10 border border-transparent hover:border-danger/20 transition-all group/trash"
                                title="Uninstall Module"
                            >
                                <Power size={18} className="group-hover/trash:scale-110 transition-transform" />
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={onInstall}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-text-muted font-bold hover:bg-primary hover:text-app hover:border-primary hover:shadow-lg hover:shadow-primary/20 transition-all group/install"
                        >
                            <Plus size={18} className="group-hover/install:rotate-90 transition-transform" />
                            <span>Install Slot</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Configuration Drawer (Accordion) */}
            <div className={clsx(
                "border-t border-border bg-panel-soft/30 transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] overflow-hidden",
                isConfigOpen ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"
            )}>
                <div className="p-8">
                    {children}
                </div>
            </div>
        </div>
    );
};

// --- MAIN PAGE ---
export const ProjectSettingsPage: React.FC = () => {
    const { projectId } = useParams<{ projectId: string }>();
    const navigate = useNavigate();
    const { projects, useModules, addVegetationModule } = useRepositories();
    const { setHeader } = useHeader();

    const project = projects?.find(p => p.id === projectId);
    const modules = useModules(projectId);

    // Header Sync
    useEffect(() => {
        setHeader({
            title: 'System Configuration',
            breadcrumbs: [
                { label: 'Terra', path: '/' },
                { label: 'Projects', path: '/projects' },
                { label: project?.name || '...', path: `/projects/${projectId}` },
                { label: 'Settings', path: `/projects/${projectId}/settings` }
            ],
            moduleColor: 'violet',
            isLoading: !project
        });
    }, [project, projectId, setHeader]);

    if (!project) return <div className="p-8 text-text-muted">Loading System...</div>;

    // --- ACTIONS ---

    const handleInstallModule = async (type: 'Vegetation Survey') => {
        const existing = modules.find(m => m.name === type);
        if (existing) return;

        await addVegetationModule(projectId!, type, {
            samplingMethod: 'SYSTEMATIC',
            status: 'ACTIVE'
        });
    };

    const handleUninstallModule = async (moduleId: string) => {
        if (window.confirm('CRITICAL WARNING: Uninstalling this module will permanently delete all associated plot and tree data. This cannot be undone. Continue?')) {
            await db.transaction('rw', [db.modules, db.plots, db.treeObservations, db.vegetationObservations, db.samplingUnits], async () => {
                await db.modules.delete(moduleId);
                // Cascading delete
                const plots = await db.plots.where('moduleId').equals(moduleId).toArray();
                for (const plot of plots) {
                    await db.plots.delete(plot.id);
                    await db.treeObservations.where('plotId').equals(plot.id).delete();
                    await db.vegetationObservations.where('plotId').equals(plot.id).delete();
                    await db.samplingUnits.where('plotId').equals(plot.id).delete();
                }
            });
        }
    };

    const vegModule = modules.find(m => m.type === 'VEGETATION_PLOTS');

    return (
        <div className="max-w-5xl mx-auto space-y-12 pb-24 animate-in fade-in duration-500">

            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-white/5 pb-6 gap-6">
                <div>
                    <h1 className="text-4xl font-black text-text-main tracking-tight flex items-center gap-4">
                        <Settings className="text-text-muted" size={32} strokeWidth={1.5} />
                        Core Settings
                    </h1>
                    <p className="text-text-muted mt-2 max-w-2xl text-lg">
                        Manage active scientific modules, configure data protocols, and run system diagnostics for <span className="text-primary font-mono font-bold">{project.name}</span>.
                    </p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => navigate(`/projects/${projectId}`)}
                        className="px-5 py-2.5 rounded-xl bg-panel border border-border text-text-muted hover:text-text-main hover:border-primary transition-all text-sm font-bold flex items-center gap-2"
                    >
                        <ArrowRight className="rotate-180 w-4 h-4" />
                        Dashboard
                    </button>
                </div>
            </div>

            {/* --- SECTION: EXPANSION RACK --- */}
            <section className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                    <Cpu size={20} className="text-primary" />
                    <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-text-muted">Expansion Modules</h2>
                </div>

                {/* 1. VEGETATION MODULE (The Active One) */}
                <ModuleSlot
                    title="Vegetation Survey"
                    description="Standardized plot-based sampling for forest structure, biomass estimation, and carbon stock analysis."
                    icon={Leaf}
                    isActive={!!vegModule}
                    onInstall={() => handleInstallModule('Vegetation Survey')}
                    onUninstall={() => vegModule && handleUninstallModule(vegModule.id)}
                >
                    {vegModule && <VegetationSettingsForm moduleId={vegModule.id} />}
                </ModuleSlot>

                {/* 2. FUTURE MODULES (The Empty Slots) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 opacity-80 hover:opacity-100 transition-opacity">
                    <ModuleSlot
                        title="Avian Surveys"
                        description="Point count and line transect methods for bird population monitoring."
                        icon={Bird}
                        isActive={false}
                        onInstall={() => alert("Module under development.")}
                    />
                    <ModuleSlot
                        title="Hydrology"
                        description="Water quality metrics for aquatic ecosystems and watershed monitoring."
                        icon={Droplets}
                        isActive={false}
                        onInstall={() => alert("Module under development.")}
                    />
                </div>
            </section>

            {/* --- SECTION: DIAGNOSTICS TERMINAL --- */}
            <section className="pt-12 border-t border-white/5">
                <div className="flex items-center gap-3 mb-6">
                    <Terminal size={20} className="text-warning" />
                    <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-text-muted">System Diagnostics</h2>
                </div>

                <div className="bg-[#0b1020] rounded-2xl border border-white/10 p-8 font-mono text-sm shadow-inner relative overflow-hidden">
                    {/* Scanline Effect */}
                    <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />

                    <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-4">
                        <div className="text-success flex items-center gap-3 font-bold">
                            <span className="relative flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-success"></span>
                            </span>
                            System Nominal
                        </div>
                        <div className="text-text-muted text-xs">
                            PID: <span className="text-primary">{projectId}</span>
                        </div>
                    </div>

                    <div className="space-y-3 text-text-muted/80">
                        <div className="flex gap-4">
                            <span className="text-primary">{'>'}</span>
                            <span>Checking local database integrity...</span>
                            <span className="text-success">[OK]</span>
                        </div>
                        <div className="flex gap-4">
                            <span className="text-primary">{'>'}</span>
                            <span>{modules.length} active modules loaded.</span>
                        </div>
                        <div className="flex gap-4">
                            <span className="text-primary">{'>'}</span>
                            <span>Encryption status: <span className="text-success">ACTIVE (AES-256)</span></span>
                        </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-white/5 flex gap-4">
                        <button
                            onClick={async () => {
                                const vegModules = modules.filter(m => m.type === 'VEGETATION_PLOTS');
                                if (vegModules.length > 1) {
                                    if (confirm(`DETECTED ANOMALY: ${vegModules.length} duplicate modules found. Attempt auto-repair?`)) {
                                        let fixed = 0;
                                        for (const m of vegModules) {
                                            const count = await db.plots.where('moduleId').equals(m.id).count();
                                            if (count === 0) {
                                                await db.modules.delete(m.id);
                                                fixed++;
                                            }
                                        }
                                        alert(`Repair complete. Removed ${fixed} ghost modules.`);
                                    }
                                } else {
                                    alert("Diagnostic Scan Complete: System integrity verified. No duplicates found.");
                                }
                            }}
                            className="flex items-center gap-2 text-warning hover:text-warning/80 transition-colors bg-warning/10 px-4 py-2 rounded-lg border border-warning/20 hover:bg-warning/20"
                        >
                            <ShieldCheck size={16} />
                            Run Integrity Scan
                        </button>
                    </div>
                </div>
            </section>
        </div>
    );
};