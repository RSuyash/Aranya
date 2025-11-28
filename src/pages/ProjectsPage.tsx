import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRepositories } from '../hooks/useRepositories';
import { db } from '../core/data-model/dexie';
import { useHeader } from '../context/HeaderContext';
import { useLiveQuery } from 'dexie-react-hooks';

// Visual Assets
import {
    Search, FolderOpen,
    Clock, Trash2,
    Database, LayoutGrid, List as ListIcon,
    Plus, HardDrive, Cpu,
    Activity, Signal
} from 'lucide-react';
import { clsx } from 'clsx';

// Components
import { ProjectCreationWizard } from '../components/projects/ProjectCreationWizard';

// --- SUB-COMPONENT: PROCEDURAL VISUALS ---
// Generates a unique "Frequency Bar" based on project ID for visual identity
const IdentityBar = ({ id }: { id: string }) => {
    const seed = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const hue = seed % 360;
    const width1 = (seed % 40) + 20;
    const width2 = ((seed * 2) % 40) + 20;

    return (
        <div className="absolute left-0 top-0 bottom-0 w-1.5 flex flex-col gap-0.5 py-4 pl-0.5 opacity-80">
            <div className="flex-1 w-full rounded-r-sm" style={{ backgroundColor: `hsl(${hue}, 70%, 60%)` }} />
            <div className="h-8 w-full rounded-r-sm opacity-50" style={{ backgroundColor: `hsl(${hue}, 70%, 60%)`, width: `${width1}%` }} />
            <div className="h-4 w-full rounded-r-sm opacity-30" style={{ backgroundColor: `hsl(${hue}, 70%, 60%)`, width: `${width2}%` }} />
        </div>
    );
};

// --- SUB-COMPONENT: ADVANCED PROJECT CARD ---
const DataCartridge = ({ project, viewMode, onClick, onDelete }: any) => {
    // Live Density Query
    const stats = useLiveQuery(async () => {
        const plots = await db.plots.where('projectId').equals(project.id).count();
        const trees = await db.treeObservations.where('projectId').equals(project.id).count();
        return { plots, trees };
    }, [project.id]);

    const isActive = (stats?.plots || 0) > 0;

    if (viewMode === 'LIST') {
        return (
            <div
                onClick={onClick}
                className="group relative flex items-center justify-between p-4 pl-6 bg-panel/60 backdrop-blur-md border border-white/5 hover:border-primary/30 rounded-xl cursor-pointer transition-all duration-300 hover:shadow-lg"
            >
                <IdentityBar id={project.id} />

                <div className="flex items-center gap-6">
                    <div className="flex flex-col">
                        <h3 className="font-bold text-text-main text-lg group-hover:text-primary transition-colors">
                            {project.name}
                        </h3>
                        <div className="flex items-center gap-3 text-xs text-text-muted">
                            <span className="flex items-center gap-1.5">
                                <Clock size={12} />
                                {new Date(project.updatedAt).toLocaleDateString()}
                            </span>
                            <span className="w-1 h-1 rounded-full bg-white/20" />
                            <span className="font-mono text-primary/80">
                                {project.id.slice(0, 8).toUpperCase()}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-8">
                    {/* Mini Stats */}
                    <div className="flex gap-6 text-xs">
                        <div className="text-right">
                            <div className="text-[9px] uppercase tracking-wider text-text-muted font-bold">Plots</div>
                            <div className="font-mono font-bold text-text-main">{stats?.plots || 0}</div>
                        </div>
                        <div className="text-right">
                            <div className="text-[9px] uppercase tracking-wider text-text-muted font-bold">Records</div>
                            <div className="font-mono font-bold text-text-main">{stats?.trees || 0}</div>
                        </div>
                    </div>

                    <button
                        onClick={(e) => onDelete(e, project.id)}
                        className="p-2 text-text-muted hover:text-danger hover:bg-danger/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                    >
                        <Trash2 size={18} />
                    </button>
                </div>
            </div>
        );
    }

    // GRID MODE (The "Cartridge")
    return (
        <div
            onClick={onClick}
            className="group relative flex flex-col h-[280px] rounded-[24px] bg-panel/40 backdrop-blur-xl border border-white/5 hover:border-primary/40 transition-all duration-500 cursor-pointer overflow-hidden hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5)] hover:-translate-y-1"
        >
            {/* Identity Spine */}
            <IdentityBar id={project.id} />

            {/* Ambient Lighting */}
            <div className="absolute top-0 right-0 p-32 bg-gradient-to-br from-primary/5 to-transparent rounded-full blur-3xl -mr-16 -mt-16 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

            <div className="relative z-10 flex flex-col h-full p-7 pl-8">

                {/* Header */}
                <div className="flex justify-between items-start mb-6">
                    <div className="p-3 rounded-2xl bg-white/5 border border-white/5 text-primary group-hover:scale-110 group-hover:bg-primary group-hover:text-app transition-all duration-500 shadow-inner">
                        <FolderOpen size={24} strokeWidth={2} />
                    </div>

                    {/* Status Pill */}
                    <div className={clsx(
                        "flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[9px] font-bold uppercase tracking-widest",
                        isActive
                            ? "bg-success/10 border-success/20 text-success shadow-[0_0_10px_rgba(16,185,129,0.1)]"
                            : "bg-text-muted/5 border-white/5 text-text-muted"
                    )}>
                        <div className={clsx("w-1.5 h-1.5 rounded-full", isActive ? "bg-success animate-pulse" : "bg-text-muted")} />
                        {isActive ? 'Online' : 'Archived'}
                    </div>
                </div>

                {/* Content */}
                <div className="mb-auto">
                    <h3 className="text-xl font-bold text-text-main mb-2 leading-tight group-hover:text-primary transition-colors line-clamp-2">
                        {project.name}
                    </h3>
                    <p className="text-xs text-text-muted line-clamp-2 leading-relaxed">
                        {project.description || "System archive. No additional metadata provided."}
                    </p>
                </div>

                {/* Data Viz / Footer */}
                <div className="pt-5 border-t border-white/5">
                    {/* Data Density Bar */}
                    <div className="flex items-end justify-between mb-2 text-[10px] font-bold uppercase tracking-wider text-text-muted">
                        <span>Storage Density</span>
                        <span className="text-primary">{stats?.trees ? Math.min(stats.trees, 100) : 0}%</span>
                    </div>
                    <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden mb-4">
                        <div
                            className="h-full bg-gradient-to-r from-primary to-blue-400 transition-all duration-1000 ease-out group-hover:brightness-125"
                            style={{ width: `${Math.min((stats?.trees || 0), 100)}%` }}
                        />
                    </div>

                    <div className="flex items-center justify-between text-xs">
                        <div className="flex gap-4">
                            <span className="flex items-center gap-1.5 text-text-main font-mono">
                                <Database size={12} className="text-text-muted" />
                                {stats?.plots || 0} <span className="text-text-muted text-[10px]">PLT</span>
                            </span>
                            <span className="flex items-center gap-1.5 text-text-main font-mono">
                                <Activity size={12} className="text-text-muted" />
                                {stats?.trees || 0} <span className="text-text-muted text-[10px]">REC</span>
                            </span>
                        </div>
                        <button
                            onClick={(e) => onDelete(e, project.id)}
                            className="text-text-muted hover:text-danger transition-colors opacity-0 group-hover:opacity-100"
                        >
                            <Trash2 size={14} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- SUB-COMPONENT: SYSTEM STATS ---
const SystemStat = ({ label, value, icon: Icon, color }: any) => (
    <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-panel-soft/50 border border-white/5 backdrop-blur-sm">
        <div className={clsx("p-2 rounded-lg bg-white/5", color)}>
            <Icon size={16} />
        </div>
        <div>
            <div className="text-[9px] uppercase tracking-wider text-text-muted font-bold opacity-80">{label}</div>
            <div className="text-base font-mono font-bold text-text-main leading-none mt-0.5">{value}</div>
        </div>
    </div>
);

// --- MAIN PAGE ---
export const ProjectsPage: React.FC = () => {
    const navigate = useNavigate();
    const { projects } = useRepositories();
    const { setHeader } = useHeader();

    // State
    const [search, setSearch] = useState('');
    const [viewMode, setViewMode] = useState<'GRID' | 'LIST'>('GRID');
    const [isWizardOpen, setIsWizardOpen] = useState(false);

    // Header Setup
    React.useEffect(() => {
        setHeader({
            title: 'Project Archives',
            breadcrumbs: [
                { label: 'Terra', path: '/' },
                { label: 'Archives', path: '/projects' }
            ],
            moduleColor: 'violet',
            isLoading: false,
            // We hide the default actions to use our custom Command Strip
            actions: null
        });
    }, [setHeader]);

    const filteredProjects = projects.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

    // Delete Handler
    const handleDelete = async (e: React.MouseEvent, projectId: string) => {
        e.stopPropagation();
        if (window.confirm('CONFIRM DELETION: This will permanently erase the project and all local data.')) {
            await db.transaction('rw', [db.projects, db.modules, db.plots, db.treeObservations, db.vegetationObservations, db.samplingUnits], async () => {
                await db.projects.delete(projectId);
                await db.modules.where('projectId').equals(projectId).delete();
                await db.plots.where('projectId').equals(projectId).delete();
                await db.treeObservations.where('projectId').equals(projectId).delete();
                await db.vegetationObservations.where('projectId').equals(projectId).delete();
                await db.samplingUnits.where('projectId').equals(projectId).delete();
            });
        }
    };

    return (
        <div className="min-h-screen pb-24 relative animate-in fade-in duration-500">

            {/* Background Texture */}
            <div className="fixed inset-0 opacity-[0.02] pointer-events-none"
                style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, var(--text-main) 1px, transparent 0)', backgroundSize: '48px 48px' }}
            />

            {/* --- SECTION 1: WORKSPACE HUD --- */}
            <div className="flex flex-col lg:flex-row items-end justify-between gap-8 mb-10 pt-4">
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                        <span className="flex h-2.5 w-2.5 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary"></span>
                        </span>
                        <span className="text-[10px] font-bold text-primary tracking-[0.2em] uppercase">Workspace Active</span>
                    </div>
                    <h1 className="text-5xl font-black text-text-main tracking-tight leading-none mb-4">
                        Project <span className="text-text-muted font-light">Archives</span>
                    </h1>
                    <p className="text-text-muted max-w-xl text-sm leading-relaxed">
                        Central repository for environmental survey data. Access, manage, and synchronize your field campaigns from this secure terminal.
                    </p>
                </div>

                {/* Stats Row */}
                <div className="flex flex-wrap gap-4">
                    <SystemStat label="Active Projects" value={projects.length.toString().padStart(2, '0')} icon={Cpu} color="text-primary" />
                    <SystemStat label="Storage Mode" value="Local" icon={HardDrive} color="text-warning" />
                    <SystemStat label="Sync Health" value="100%" icon={Signal} color="text-success" />
                </div>
            </div>

            {/* --- SECTION 2: COMMAND STRIP (Sticky) --- */}
            <div className="sticky top-4 z-30 mb-8">
                <div className="bg-panel/80 backdrop-blur-xl border border-white/10 rounded-2xl p-2 pl-4 flex flex-col md:flex-row gap-4 items-center shadow-2xl shadow-black/20">

                    {/* Search Field */}
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-0 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                        <input
                            type="text"
                            placeholder="Search archives by name, ID, or tag..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-transparent border-none py-3 pl-8 pr-4 text-text-main placeholder:text-text-muted/50 focus:ring-0 text-lg"
                        />
                    </div>

                    {/* Controls Group */}
                    <div className="flex items-center gap-2 w-full md:w-auto p-1">

                        {/* View Toggles */}
                        <div className="flex bg-white/5 rounded-xl p-1 border border-white/5">
                            <button
                                onClick={() => setViewMode('GRID')}
                                className={clsx("p-2.5 rounded-lg transition-all", viewMode === 'GRID' ? "bg-panel shadow-sm text-primary" : "text-text-muted hover:text-text-main")}
                            >
                                <LayoutGrid size={18} />
                            </button>
                            <button
                                onClick={() => setViewMode('LIST')}
                                className={clsx("p-2.5 rounded-lg transition-all", viewMode === 'LIST' ? "bg-panel shadow-sm text-primary" : "text-text-muted hover:text-text-main")}
                            >
                                <ListIcon size={18} />
                            </button>
                        </div>

                        <div className="w-px h-8 bg-white/10 mx-2" />

                        {/* Primary Action */}
                        <button
                            onClick={() => setIsWizardOpen(true)}
                            className="flex-1 md:flex-none flex items-center gap-3 bg-primary hover:bg-primary/90 text-app px-6 py-3 rounded-xl font-bold transition-all shadow-[0_0_20px_-5px_var(--primary)] hover:-translate-y-0.5 active:translate-y-0"
                        >
                            <Plus size={20} strokeWidth={3} />
                            <span className="whitespace-nowrap">New Project</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* --- SECTION 3: THE GRID --- */}
            {filteredProjects.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-32 border-2 border-dashed border-white/5 rounded-[32px] bg-white/[0.01] mx-2">
                    <div className="w-24 h-24 bg-panel/50 border border-white/5 rounded-full flex items-center justify-center mb-6 shadow-2xl animate-pulse">
                        <Database className="w-10 h-10 text-text-muted opacity-50" />
                    </div>
                    <h3 className="text-2xl font-bold text-text-main mb-2">System Empty</h3>
                    <p className="text-text-muted text-center max-w-sm mb-8 leading-relaxed">
                        No Project archives found in local storage.<br />
                        Initialize a new campaign to begin data collection.
                    </p>
                    <button
                        onClick={() => setIsWizardOpen(true)}
                        className="text-primary font-bold hover:text-primary/80 transition-colors flex items-center gap-2"
                    >
                        <Plus size={16} /> Initialize Project
                    </button>
                </div>
            ) : (
                <div className={clsx(
                    "grid gap-6 animate-in slide-in-from-bottom-8 duration-500",
                    viewMode === 'GRID' ? "grid-cols-1 md:grid-cols-2 xl:grid-cols-3" : "grid-cols-1"
                )}>
                    {filteredProjects.map(project => (
                        <DataCartridge
                            key={project.id}
                            project={project}
                            viewMode={viewMode}
                            onClick={() => navigate(`/projects/${project.id}`)}
                            onDelete={handleDelete}
                        />
                    ))}
                </div>
            )}

            {/* --- WIZARD INTEGRATION --- */}
            <ProjectCreationWizard
                isOpen={isWizardOpen}
                onClose={() => setIsWizardOpen(false)}
                onProjectCreated={(id) => navigate(`/projects/${id}`)}
            />
        </div>
    );
};