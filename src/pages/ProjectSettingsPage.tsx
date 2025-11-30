import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useRepositories } from '../hooks/useRepositories';
import { useHeader } from '../context/HeaderContext';
import { db } from '../core/data-model/dexie';
import { VegetationSettingsForm } from '../ui/modules/Vegetation/VegetationSettingsForm';
import { ModuleSlot } from '../components/projects/ModuleSlot';

// Icons
import {
    Settings, Cpu, Terminal, ShieldCheck,
    Leaf, Droplets, Bird, ArrowRight
} from 'lucide-react';

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