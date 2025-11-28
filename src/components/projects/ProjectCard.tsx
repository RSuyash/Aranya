import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../core/data-model/dexie';
import type { Project } from '../../core/data-model/types';
import {
    FolderOpen,
    Clock,
    Trash2,
    Database,
    Activity
} from 'lucide-react';
import { clsx } from 'clsx';

interface ProjectCardProps {
    project: Project;
    onClick?: () => void;
    onDelete?: (e: React.MouseEvent) => void;
    viewMode?: 'GRID' | 'LIST';
}

// --- SUB-COMPONENT: IDENTITY SPINE ---
// Generates a unique "Barcode/Energy" pattern based on the Project ID
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

export const ProjectCard: React.FC<ProjectCardProps> = ({
    project,
    onClick,
    onDelete,
    viewMode = 'GRID'
}) => {
    // --- LIVE TELEMETRY ---
    // Fetch real-time stats for this project
    const stats = useLiveQuery(async () => {
        const plots = await db.plots.where('projectId').equals(project.id).count();
        const trees = await db.treeObservations.where('projectId').equals(project.id).count();
        return { plots, trees };
    }, [project.id]);

    const storageDensity = Math.min((stats?.trees || 0), 100); // Visual cap for the bar

    // --- LIST VIEW (Compact) ---
    if (viewMode === 'LIST') {
        return (
            <div
                onClick={onClick}
                className="group relative flex items-center justify-between p-4 pl-6 bg-panel border border-border hover:border-primary/50 rounded-xl cursor-pointer transition-all duration-200 hover:shadow-md"
            >
                <IdentityBar id={project.id} />

                <div className="flex items-center gap-6">
                    <div className="flex flex-col">
                        <h3 className="font-bold text-text-main text-lg group-hover:text-primary transition-colors">
                            {project.name}
                        </h3>
                        <div className="flex items-center gap-3 text-xs text-text-muted">
                            <span className="flex items-center gap-1.5 font-mono">
                                <Clock size={12} />
                                {new Date(project.updatedAt).toLocaleDateString()}
                            </span>
                            <span className="w-1 h-1 rounded-full bg-border" />
                            <span className="font-mono text-primary/80 opacity-60">
                                {project.id.slice(0, 8).toUpperCase()}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-8">
                    {/* Mini Stats */}
                    <div className="hidden sm:flex gap-6 text-xs">
                        <div className="text-right">
                            <div className="text-[9px] uppercase tracking-wider text-text-muted font-bold">Plots</div>
                            <div className="font-mono font-bold text-text-main">{stats?.plots || 0}</div>
                        </div>
                        <div className="text-right">
                            <div className="text-[9px] uppercase tracking-wider text-text-muted font-bold">Records</div>
                            <div className="font-mono font-bold text-text-main">{stats?.trees || 0}</div>
                        </div>
                    </div>

                    {onDelete && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onDelete(e); }}
                            className="p-2 text-text-muted hover:text-danger hover:bg-danger/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                        >
                            <Trash2 size={18} />
                        </button>
                    )}
                </div>
            </div>
        );
    }

    // --- GRID VIEW (The "Cartridge") ---
    return (
        <div
            onClick={onClick}
            className="group relative flex flex-col h-[280px] rounded-[24px] bg-panel/40 backdrop-blur-xl border border-white/5 hover:border-primary/40 transition-all duration-500 cursor-pointer overflow-hidden hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5)] hover:-translate-y-1"
        >
            {/* Identity Spine */}
            <IdentityBar id={project.id} />

            {/* Ambient Lighting (Holographic Effect) */}
            <div className="absolute top-0 right-0 p-32 bg-gradient-to-br from-primary/5 to-transparent rounded-full blur-3xl -mr-16 -mt-16 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

            <div className="relative z-10 flex flex-col h-full p-7 pl-8">

                {/* Header Row */}
                <div className="flex justify-between items-start mb-6">
                    <div className="p-3 rounded-2xl bg-white/5 border border-white/5 text-primary group-hover:scale-110 group-hover:bg-primary group-hover:text-app transition-all duration-500 shadow-inner">
                        <FolderOpen size={24} strokeWidth={2} />
                    </div>

                    {/* Status LED Pill */}
                    <div className={clsx(
                        "flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[9px] font-bold uppercase tracking-widest",
                        project.syncStatus === 'LOCAL_ONLY'
                            ? "bg-text-muted/5 border-white/5 text-text-muted"
                            : "bg-success/10 border-success/20 text-success shadow-[0_0_10px_rgba(16,185,129,0.1)]"
                    )}>
                        <div className={clsx("w-1.5 h-1.5 rounded-full", project.syncStatus === 'SYNCED' ? "bg-success animate-pulse" : "bg-text-muted")} />
                        {project.syncStatus === 'LOCAL_ONLY' ? 'Local' : 'Synced'}
                    </div>
                </div>

                {/* Main Content */}
                <div className="mb-auto">
                    <h3 className="text-xl font-bold text-text-main mb-2 leading-tight group-hover:text-primary transition-colors line-clamp-2">
                        {project.name}
                    </h3>
                    <p className="text-xs text-text-muted line-clamp-2 leading-relaxed h-8">
                        {project.description || "System archive. No additional metadata provided."}
                    </p>
                </div>

                {/* Data Viz Footer */}
                <div className="pt-5 border-t border-white/5">

                    {/* "Storage Density" Bar */}
                    <div className="flex items-end justify-between mb-2 text-[10px] font-bold uppercase tracking-wider text-text-muted">
                        <span>Data Saturation</span>
                        <span className="text-primary">{storageDensity}%</span>
                    </div>
                    <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden mb-4">
                        <div
                            className="h-full bg-gradient-to-r from-primary to-blue-400 transition-all duration-1000 ease-out group-hover:brightness-125"
                            style={{ width: `${storageDensity}%` }}
                        />
                    </div>

                    {/* Footer Metrics */}
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

                        {onDelete && (
                            <button
                                onClick={(e) => { e.stopPropagation(); onDelete(e); }}
                                className="text-text-muted hover:text-danger transition-colors opacity-0 group-hover:opacity-100 p-1"
                                title="Delete Archive"
                            >
                                <Trash2 size={14} />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};