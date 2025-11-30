import React, { useState, useRef, useEffect } from 'react';
import {
    X, FileArchive, FileText,
    ArrowRight, AlertTriangle,
    FolderPlus, Activity, ChevronLeft,
    Lock, Zap
} from 'lucide-react';
import { clsx } from 'clsx';
import { CreateProjectForm } from './CreateProjectForm';
import { ImportWizardModal } from '../import-wizard/ImportWizardModal';
import { parseUniversalImport } from '../../utils/sync/terraImport';
import { checkProjectExists, commitImport } from '../../utils/sync/import';
import type { ProjectExportData } from '../../utils/sync/export';

interface ProjectCreationWizardProps {
    isOpen: boolean;
    onClose: () => void;
    onProjectCreated: (projectId: string) => void;
}

type WizardMode = 'SELECT' | 'CREATE_BLANK' | 'RESTORE' | 'IMPORT_CSV';

export const ProjectCreationWizard: React.FC<ProjectCreationWizardProps> = ({
    isOpen,
    onClose,
    onProjectCreated
}) => {
    const [mode, setMode] = useState<WizardMode>('SELECT');
    const [dragActive, setDragActive] = useState(false);

    // Restore/Import State
    const [isProcessing, setIsProcessing] = useState(false);
    const [importData, setImportData] = useState<ProjectExportData | null>(null);
    const [conflictError, setConflictError] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // CSV Wizard State
    const [showCSVWizard, setShowCSVWizard] = useState(false);

    // Reset on open
    useEffect(() => {
        if (isOpen) {
            setMode('SELECT');
            setImportData(null);
            setConflictError(false);
            setIsProcessing(false);
        }
    }, [isOpen]);

    if (!isOpen && !showCSVWizard) return null;

    // --- HANDLERS ---

    const handleFile = async (file: File) => {
        setIsProcessing(true);
        try {
            const data = await parseUniversalImport(file);
            const exists = await checkProjectExists(data.project.id);

            if (exists) {
                setImportData(data);
                setConflictError(true);
                setMode('RESTORE');
            } else {
                await executeImport(data, 'REPLACE');
            }
        } catch (err) {
            alert("Invalid File: " + (err as Error).message);
            setMode('SELECT');
        } finally {
            setIsProcessing(false);
        }
    };

    const executeImport = async (data: ProjectExportData, method: 'REPLACE' | 'CREATE_NEW') => {
        setIsProcessing(true);
        try {
            const pid = await commitImport(data, method);
            onProjectCreated(pid);
            onClose();
        } catch (e) {
            console.error(e);
            alert("Import Failed");
        } finally {
            setIsProcessing(false);
        }
    };

    // --- RENDERERS ---

    const renderSelectionScreen = () => (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 h-full animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* 1. HERO CARD: Initialize New Project (Takes 3/5 width) */}
            <button
                onClick={() => setMode('CREATE_BLANK')}
                className="lg:col-span-3 group relative flex flex-col justify-between p-8 rounded-[32px] overflow-hidden text-left transition-all duration-500 hover:shadow-2xl hover:-translate-y-1 ring-1 ring-white/10 hover:ring-primary/50"
            >
                {/* Dynamic Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-panel-soft via-panel to-panel z-0" />
                <div className="absolute inset-0 bg-grid-white/[0.02] bg-[length:32px_32px] z-0" />

                {/* Active Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-0" />

                {/* Content */}
                <div className="relative z-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold uppercase tracking-widest mb-6 group-hover:bg-primary group-hover:text-white transition-colors">
                        <Zap size={12} className="fill-current" /> Recommended
                    </div>

                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-blue-600 text-white flex items-center justify-center mb-6 shadow-xl shadow-primary/20 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500">
                        <FolderPlus size={32} strokeWidth={2} />
                    </div>

                    <h3 className="text-3xl font-black text-text-main mb-3 tracking-tight">Initialize New<br />Project</h3>
                    <p className="text-text-muted text-sm leading-relaxed max-w-sm group-hover:text-text-main transition-colors">
                        Start a fresh survey workspace. Configure sampling protocols, plot designs, and modules from scratch.
                    </p>
                </div>

                <div className="relative z-10 mt-8 flex items-center gap-3 text-primary font-bold text-sm group-hover:translate-x-2 transition-transform">
                    <span>Begin Configuration</span>
                    <ArrowRight size={18} strokeWidth={3} />
                </div>
            </button>

            {/* 2. SIDE STACK: Import & Restore (Takes 2/5 width) */}
            <div className="lg:col-span-2 flex flex-col gap-4">

                {/* Restore Archive (Dropzone) */}
                <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                    onDragLeave={() => setDragActive(false)}
                    onDrop={(e) => {
                        e.preventDefault();
                        setDragActive(false);
                        if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
                    }}
                    className={clsx(
                        "flex-1 relative p-6 rounded-[24px] border-2 border-dashed transition-all cursor-pointer flex flex-col justify-center group overflow-hidden",
                        dragActive
                            ? "bg-primary/10 border-primary scale-[1.02]"
                            : "bg-panel-soft/50 border-white/10 hover:bg-panel hover:border-success/50"
                    )}
                >
                    {/* [THORNE FIX] Expanded MIME types to allow .fldx on Android */}
                    <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        accept=".fldx,.terx,.zip,.json,application/zip,application/json,application/octet-stream"
                        onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
                    />

                    {/* Hover Glow */}
                    <div className="absolute -right-10 -top-10 w-32 h-32 bg-success/20 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />

                    <div className="relative z-10">
                        <div className="flex items-center gap-4 mb-2">
                            <div className="p-3 rounded-xl bg-panel border border-white/10 text-success shadow-sm">
                                <FileArchive size={20} />
                            </div>
                            <div>
                                <h3 className="font-bold text-text-main">Restore Archive</h3>
                                <span className="text-[10px] font-bold text-success uppercase tracking-wider">.FLDX / .ZIP</span>
                            </div>
                        </div>
                        <p className="text-xs text-text-muted mt-2 pl-1 leading-relaxed">
                            {dragActive ? "Drop file to restore..." : "Drag & drop backup file here to restore system state."}
                        </p>
                    </div>
                </div>

                {/* Import CSV */}
                <button
                    onClick={() => { onClose(); setShowCSVWizard(true); }}
                    className="flex-1 relative p-6 rounded-[24px] bg-panel-soft/50 border border-white/10 hover:bg-panel hover:border-warning/50 transition-all text-left group overflow-hidden"
                >
                    {/* Hover Glow */}
                    <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-warning/20 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />

                    <div className="relative z-10">
                        <div className="flex items-center gap-4 mb-2">
                            <div className="p-3 rounded-xl bg-panel border border-white/10 text-warning shadow-sm">
                                <FileText size={20} />
                            </div>
                            <div>
                                <h3 className="font-bold text-text-main">Import CSV</h3>
                                <span className="text-[10px] font-bold text-warning uppercase tracking-wider">Legacy Data</span>
                            </div>
                        </div>
                        <p className="text-xs text-text-muted mt-2 pl-1 leading-relaxed">
                            Map raw spreadsheet columns to the Terra data structure.
                        </p>
                    </div>
                </button>
            </div>
        </div>
    );

    const renderConflictScreen = () => (
        <div className="flex flex-col h-full animate-in fade-in zoom-in-95">
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                <div className="w-24 h-24 rounded-full bg-warning/10 border-4 border-warning/20 flex items-center justify-center mb-6 animate-pulse">
                    <Lock size={40} className="text-warning" />
                </div>
                <h3 className="text-3xl font-black text-text-main mb-3 tracking-tight">ID Conflict Detected</h3>
                <p className="text-text-muted max-w-sm mb-10 text-base">
                    The project <span className="font-mono text-warning bg-warning/10 px-1.5 py-0.5 rounded text-sm">"{importData?.project.name}"</span> already exists on this device.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl">
                    <button
                        onClick={() => importData && executeImport(importData, 'CREATE_NEW')}
                        className="flex flex-col items-start p-6 rounded-2xl bg-panel border border-border hover:border-primary hover:bg-primary/5 transition-all group"
                    >
                        <div className="flex items-center gap-3 mb-2">
                            <FolderPlus size={20} className="text-primary" />
                            <span className="font-bold text-text-main group-hover:text-primary">Clone as Copy</span>
                        </div>
                        <p className="text-xs text-text-muted text-left">
                            Generates new IDs for all data points. Safe & recommended.
                        </p>
                    </button>

                    <button
                        onClick={() => importData && executeImport(importData, 'REPLACE')}
                        className="flex flex-col items-start p-6 rounded-2xl bg-panel border border-border hover:border-danger hover:bg-danger/5 transition-all group"
                    >
                        <div className="flex items-center gap-3 mb-2">
                            <AlertTriangle size={20} className="text-danger" />
                            <span className="font-bold text-text-main group-hover:text-danger">Overwrite</span>
                        </div>
                        <p className="text-xs text-text-muted text-left">
                            Permanently destroys the local version. Irreversible.
                        </p>
                    </button>
                </div>
            </div>
            <div className="p-6 border-t border-white/5 bg-panel-soft/30 flex justify-center">
                <button onClick={() => setMode('SELECT')} className="text-sm font-bold text-text-muted hover:text-text-main transition-colors">
                    Cancel Import
                </button>
            </div>
        </div>
    );

    // --- MAIN RENDER ---

    if (showCSVWizard) {
        return <ImportWizardModal currentUserId="current-user" onClose={() => setShowCSVWizard(false)} />;
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">

            {/* Backdrop with Noise */}
            <div className="absolute inset-0 bg-app/80 backdrop-blur-xl animate-in fade-in duration-300" onClick={onClose} />

            <div className={clsx(
                "relative bg-panel border border-white/10 rounded-[32px] w-full shadow-2xl flex flex-col overflow-hidden transition-all duration-500 z-10",
                "shadow-[0_0_50px_-10px_rgba(0,0,0,0.5)]",
                mode === 'CREATE_BLANK' ? "max-w-xl h-auto" : "max-w-5xl h-[600px]"
            )}>

                {/* Header */}
                {!conflictError && (
                    <div className="px-8 py-6 border-b border-white/5 flex justify-between items-center bg-panel-soft/50 backdrop-blur-md">
                        <div className="flex items-center gap-4">
                            {mode !== 'SELECT' && (
                                <button onClick={() => setMode('SELECT')} className="p-2 -ml-2 rounded-full hover:bg-white/10 text-text-muted hover:text-text-main transition">
                                    <ChevronLeft size={20} />
                                </button>
                            )}
                            <div>
                                <h2 className="text-xl font-bold text-text-main flex items-center gap-2 tracking-tight">
                                    {mode === 'SELECT' && <><Activity className="text-primary w-5 h-5" /> Project Genesis</>}
                                    {mode === 'CREATE_BLANK' && "New Project Details"}
                                    {mode === 'RESTORE' && "Restoring Archive..."}
                                </h2>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 transition text-text-muted hover:text-text-main">
                            <X size={20} />
                        </button>
                    </div>
                )}

                {/* Content Area */}
                <div className="flex-1 relative overflow-hidden bg-panel/50">
                    {/* Noise Overlay */}
                    <div className="absolute inset-0 opacity-[0.02] pointer-events-none"
                        style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, var(--text-muted) 1px, transparent 0)', backgroundSize: '24px 24px' }}
                    />

                    {/* Loading Overlay */}
                    {isProcessing && (
                        <div className="absolute inset-0 z-50 bg-app/80 backdrop-blur-sm flex flex-col items-center justify-center">
                            <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-6" />
                            <p className="text-text-main font-bold text-lg animate-pulse">Processing Data...</p>
                        </div>
                    )}

                    <div className="h-full overflow-y-auto p-8 custom-scrollbar">
                        {conflictError ? renderConflictScreen() : (
                            <>
                                {mode === 'SELECT' && renderSelectionScreen()}
                                {mode === 'CREATE_BLANK' && (
                                    <CreateProjectForm
                                        onSuccess={() => { onClose(); }}
                                        onCancel={() => setMode('SELECT')}
                                    />
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};