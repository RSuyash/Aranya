import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useRepositories } from '../hooks/useRepositories';
import { useHeader } from '../context/HeaderContext';
import { clsx } from 'clsx';

// Visual Assets
import {
    LayoutDashboard,
    Database,
    LineChart,
    Settings,
    HardDrive,
    Activity,
    ArrowUpRight,
    Cpu,
    Radio
} from 'lucide-react';

// Modules
import { FieldDataContainer } from '../ui/modules/DataManagement/FieldDataContainer';
import { ProjectOverview } from '../ui/modules/Project/ProjectOverview';
import { DataManagementPanel } from '../ui/modules/DataManagement/DataManagementPanel';

type Tab = 'OVERVIEW' | 'DATA' | 'ANALYSIS' | 'MANAGE' | 'SETTINGS';

export const ProjectDetailsPage: React.FC = () => {
    const { projectId } = useParams<{ projectId: string }>();
    const navigate = useNavigate();
    const { projects } = useRepositories();
    const { setHeader } = useHeader();

    const project = projects?.find(p => p.id === projectId);
    const [activeTab, setActiveTab] = useState<Tab>('DATA');

    // Header Synchronization
    useEffect(() => {
        setHeader({
            title: project ? project.name : 'Loading Mission...',
            breadcrumbs: [
                { label: 'Terra', path: '/' },
                { label: 'Projects', path: '/projects' },
                { label: project?.name || 'Loading...', path: `/projects/${projectId}` }
            ],
            isLoading: !project,
            moduleColor: 'cyan', // High-tech Cyan theme
            status: project ? (
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                    </span>
                    <span className="text-[10px] font-bold text-primary uppercase tracking-widest">
                        Mission Active
                    </span>
                </div>
            ) : null,
            // Clear actions to let the page control its own tools
            actions: null
        });
    }, [project, projectId, setHeader]);

    // Handle Project Not Found
    if (!project) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] text-text-muted animate-in fade-in zoom-in duration-500">
                <div className="w-24 h-24 rounded-full bg-panel border border-border flex items-center justify-center mb-6 shadow-2xl">
                    <Activity className="w-10 h-10 text-text-muted opacity-50" />
                </div>
                <h3 className="text-xl font-bold text-text-main mb-2">Signal Lost</h3>
                <p className="text-sm text-text-muted mb-8">Project data could not be retrieved.</p>
                <button
                    onClick={() => navigate('/projects')}
                    className="px-6 py-2 bg-panel-soft hover:bg-panel border border-border rounded-lg text-text-main font-medium transition-all"
                >
                    Return to Archives
                </button>
            </div>
        );
    }

    // --- SUB-COMPONENTS ---

    const TabButton = ({ id, label, icon: Icon }: { id: Tab, label: string, icon: any }) => {
        const isActive = activeTab === id;
        return (
            <button
                onClick={() => setActiveTab(id)}
                className={clsx(
                    "relative flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 group overflow-hidden",
                    isActive
                        ? "text-primary shadow-[0_0_20px_-5px_rgba(var(--primary),0.3)]"
                        : "text-text-muted hover:text-text-main hover:bg-panel-soft"
                )}
            >
                {/* Active Background Mesh */}
                {isActive && (
                    <div className="absolute inset-0 bg-primary/10 border border-primary/20 rounded-xl" />
                )}

                <Icon size={18} className={clsx("transition-transform duration-300", isActive && "scale-110")} strokeWidth={isActive ? 2.5 : 2} />
                <span className="tracking-wide">{label}</span>

                {/* Active Indicator Dot */}
                {isActive && (
                    <div className="w-1 h-1 rounded-full bg-primary shadow-[0_0_5px_var(--primary)] ml-1" />
                )}
            </button>
        );
    };

    return (
        <div className="h-full flex flex-col bg-app relative overflow-hidden">
            {/* Ambient Background - Gradient uses CSS var for theme safety */}
            <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />

            {/* --- COMMAND STRIP (Navigation) --- */}
            <div className="flex-shrink-0 z-20 px-4 md:px-8 pt-4 pb-2">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-1.5 bg-panel/80 backdrop-blur-xl border border-border rounded-2xl shadow-xl">

                    {/* Tabs Group */}
                    <div className="flex items-center gap-1 w-full md:w-auto overflow-x-auto scrollbar-none">
                        <TabButton id="OVERVIEW" label="Overview" icon={LayoutDashboard} />
                        <div className="w-px h-6 bg-border mx-1" />
                        <TabButton id="DATA" label="Field Data" icon={Database} />
                        <TabButton id="ANALYSIS" label="Analytics" icon={LineChart} />
                        <div className="w-px h-6 bg-border mx-1" />
                        <TabButton id="MANAGE" label="Systems" icon={HardDrive} />
                        <TabButton id="SETTINGS" label="Config" icon={Settings} />
                    </div>

                    {/* Context Info (Desktop) */}
                    <div className="hidden md:flex items-center gap-4 px-4">
                        <div className="flex flex-col items-end">
                            <span className="text-[9px] font-bold text-text-muted uppercase tracking-widest">Storage</span>
                            <span className="text-xs font-mono text-primary flex items-center gap-1">
                                <HardDrive size={10} /> Local
                            </span>
                        </div>
                        <div className="w-px h-8 bg-border" />
                        <div className="flex flex-col items-end">
                            <span className="text-[9px] font-bold text-text-muted uppercase tracking-widest">Sync</span>
                            <span className="text-xs font-mono text-success flex items-center gap-1">
                                <Radio size={10} /> Active
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- MAIN VIEWPORT --- */}
            <div className={clsx(
                "flex-1 relative z-10 transition-all duration-500",
                activeTab === 'DATA' ? "overflow-hidden" : "overflow-y-auto custom-scrollbar"
            )}>
                {activeTab === 'DATA' ? (
                    // Full height container for map/table
                    <FieldDataContainer projectId={projectId!} />
                ) : (
                    // Scrollable container for other pages
                    <div className="max-w-[1600px] mx-auto p-4 md:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

                        {activeTab === 'OVERVIEW' && <ProjectOverview projectId={projectId!} />}

                        {activeTab === 'ANALYSIS' && (
                            <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-border rounded-3xl bg-panel-soft/30">
                                <div className="w-20 h-20 bg-panel border border-border rounded-full flex items-center justify-center mb-6 shadow-2xl">
                                    <LineChart className="w-10 h-10 text-primary" />
                                </div>
                                <h3 className="text-xl font-bold text-text-main">Analytics Module</h3>
                                <p className="text-text-muted mt-2 max-w-sm text-center">
                                    Advanced ecological analysis tools are online. Calculate species diversity, abundance, and biomass distribution.
                                </p>
                                <button
                                    onClick={() => navigate(`/projects/${projectId}/analysis`)}
                                    className="mt-8 px-6 py-3 rounded-xl bg-primary text-app font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 flex items-center gap-2"
                                >
                                    <Activity size={18} /> Launch Console
                                </button>
                            </div>
                        )}

                        {activeTab === 'MANAGE' && <DataManagementPanel projectId={projectId!} />}

                        {activeTab === 'SETTINGS' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Configuration Deck Entry */}
                                <button
                                    onClick={() => navigate(`/projects/${projectId}/settings`)}
                                    className="group relative overflow-hidden rounded-[32px] bg-panel border border-border p-8 text-left transition-all hover:border-primary/50 hover:shadow-2xl"
                                >
                                    <div className="absolute top-0 right-0 p-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 opacity-0 group-hover:opacity-100 transition-opacity" />

                                    <div className="relative z-10">
                                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-blue-600 text-white flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform">
                                            <Cpu size={28} />
                                        </div>
                                        <h3 className="text-2xl font-bold text-text-main mb-2">Core Configuration</h3>
                                        <p className="text-sm text-text-muted mb-8 max-w-sm leading-relaxed">
                                            Manage scientific modules, sampling protocols, and hardware integration settings.
                                        </p>
                                        <div className="flex items-center gap-2 text-primary font-bold text-sm">
                                            Enter Deck <ArrowUpRight size={18} />
                                        </div>
                                    </div>
                                </button>

                                {/* Diagnostics Entry */}
                                <div className="rounded-[32px] bg-panel-soft/50 border border-border p-8 flex flex-col justify-center items-start">
                                    <div className="flex items-center gap-3 mb-4 text-warning">
                                        <Activity size={24} />
                                        <span className="font-bold uppercase tracking-wider text-sm">System Health</span>
                                    </div>
                                    <div className="space-y-4 w-full">
                                        <div className="flex justify-between items-center p-3 bg-panel border border-border rounded-xl">
                                            <span className="text-sm text-text-muted">Database Integrity</span>
                                            <span className="text-xs font-bold text-success bg-success/10 px-2 py-1 rounded">GOOD</span>
                                        </div>
                                        <div className="flex justify-between items-center p-3 bg-panel border border-border rounded-xl">
                                            <span className="text-sm text-text-muted">Module Status</span>
                                            <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded">ONLINE</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};