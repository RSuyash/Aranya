import React, { useState, useRef, useEffect } from 'react';
import { useRepositories } from '../hooks/useRepositories';
import { ProjectCard } from '../components/projects/ProjectCard';
import { CreateProjectForm } from '../components/projects/CreateProjectForm';
import { Button } from '../components/ui/Button';
import { MagnifyingGlass, Warning, FileArrowUp, Copy, FileCsv } from 'phosphor-react';
import { UploadCloud, FilePlus, Loader2, FileArchive } from 'lucide-react';
import { Input } from '../components/ui/Input';
import { useNavigate } from 'react-router-dom';
import { parseUniversalImport } from '../utils/sync/terraImport';
import { checkProjectExists, commitImport } from '../utils/sync/import';
import type { ProjectExportData } from '../utils/sync/export';
import { db } from '../core/data-model/dexie';
import { useHeader } from '../context/HeaderContext';
import { ImportWizardModal } from '../components/import-wizard/ImportWizardModal';

export const ProjectsPage: React.FC = () => {
    const { projects } = useRepositories();
    const navigate = useNavigate();
    const [isCreating, setIsCreating] = useState(false);
    const [search, setSearch] = useState('');
    const { setHeader } = useHeader();
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Import State
    const [importData, setImportData] = useState<ProjectExportData | null>(null);
    const [importConflict, setImportConflict] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [showImportWizard, setShowImportWizard] = useState(false);
    const [isDragOver, setIsDragOver] = useState(false);

    // Set Header Context
    useEffect(() => {
        setHeader({
            title: 'Projects',
            breadcrumbs: [
                { label: 'Terra', path: '/' },
                { label: 'Projects', path: '/projects' }
            ],
            actions: null,
            status: null,
            moduleColor: 'default',
            isLoading: false
        });
    }, [setHeader]);

    // Handle PWA File Launch (Double Click)
    useEffect(() => {
        if ('launchQueue' in window) {
            // @ts-ignore - Types might not be available
            window.launchQueue.setConsumer(async (launchParams: any) => {
                if (launchParams.files && launchParams.files.length > 0) {
                    const fileHandle = launchParams.files[0];
                    const file = await fileHandle.getFile();
                    await processFile(file);
                }
            });
        }
    }, []);

    // File Handler
    const processFile = async (file: File) => {
        setIsImporting(true);
        try {
            // Universal parser handles .terx, .zip, and .json
            const data = await parseUniversalImport(file);

            // Existing conflict check logic...
            const exists = await checkProjectExists(data.project.id);
            setImportData(data);

            if (exists) {
                setImportConflict(true);
            } else {
                await executeImport(data, 'REPLACE');
            }
        } catch (err) {
            console.error(err);
            alert("Invalid File: " + (err as Error).message);
        } finally {
            setIsImporting(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            await processFile(e.dataTransfer.files[0]);
        }
    };

    const executeImport = async (data: ProjectExportData, mode: 'REPLACE' | 'CREATE_NEW') => {
        setIsImporting(true);
        try {
            const projectId = await commitImport(data, mode);
            setImportData(null);
            setImportConflict(false);
            navigate(`/projects/${projectId}`);
        } catch (error) {
            console.error(error);
            alert("Import failed during database write.");
        } finally {
            setIsImporting(false);
        }
    };

    const handleDeleteProject = async (e: React.MouseEvent, projectId: string) => {
        e.stopPropagation();
        if (window.confirm('⚠️ DELETE PROJECT?\n\nThis will permanently delete the project, all plots, and all collected data.\nThis cannot be undone.')) {
            try {
                await db.transaction('rw', [db.projects, db.modules, db.plots, db.treeObservations, db.vegetationObservations, db.samplingUnits], async () => {
                    await db.projects.delete(projectId);
                    await db.modules.where('projectId').equals(projectId).delete();
                    await db.plots.where('projectId').equals(projectId).delete();
                    await db.treeObservations.where('projectId').equals(projectId).delete();
                    await db.vegetationObservations.where('projectId').equals(projectId).delete();
                    await db.samplingUnits.where('projectId').equals(projectId).delete();
                });
            } catch (err) {
                console.error(err);
                alert('Error deleting project');
            }
        }
    };

    const filteredProjects = projects.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div
            className="space-y-8 min-h-[calc(100vh-120px)] relative"
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
        >
            {/* Drag & Drop Overlay */}
            {isDragOver && (
                <div className="absolute inset-0 z-50 bg-[#050814]/90 border-2 border-dashed border-[#56ccf2] rounded-2xl flex flex-col items-center justify-center pointer-events-none animate-in fade-in">
                    <UploadCloud className="w-16 h-16 text-[#56ccf2] mb-4" />
                    <h3 className="text-2xl font-bold text-white">Drop to Import</h3>
                    <p className="text-[#56ccf2]">Supports .terx, .zip, .json</p>
                </div>
            )}

            {/* Header Actions */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-text-main">Projects</h2>
                    <p className="text-text-muted">Manage your environmental surveys.</p>
                </div>
                <div className="flex gap-2">
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept=".terx,.zip,.json" // Accept all formats
                        onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])}
                    />

                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isImporting}
                        className="flex items-center gap-2 bg-[#1d2440] text-[#9ba2c0] hover:text-[#f5f7ff] hover:bg-[#2a3454] px-4 py-2 rounded-lg font-medium border border-[#1d2440] transition"
                    >
                        {isImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileArchive className="w-4 h-4" />}
                        Import Project
                    </button>

                    <Button
                        variant="secondary"
                        leftIcon={<FileCsv size={18} />}
                        onClick={() => setShowImportWizard(true)}
                    >
                        Import CSV
                    </Button>

                    <button
                        onClick={() => setIsCreating(true)}
                        className="flex items-center gap-2 bg-[#56ccf2] text-[#050814] px-4 py-2 rounded-lg font-bold hover:bg-[#4ab8de] transition shadow-lg shadow-[#56ccf2]/20"
                    >
                        <FilePlus className="w-4 h-4" />
                        New Project
                    </button>
                </div>
            </div>

            {/* Import Wizard Modal */}
            {showImportWizard && (
                <ImportWizardModal
                    currentUserId="user-lab-admin"
                    onClose={() => setShowImportWizard(false)}
                />
            )}

            {/* Import Conflict Modal */}
            {importConflict && importData && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-[#0b1020] border border-[#1d2440] rounded-2xl max-w-md w-full p-6 shadow-2xl">
                        <div className="flex items-center gap-3 text-[#f2c94c] mb-4">
                            <Warning size={32} weight="fill" />
                            <h3 className="text-xl font-bold text-white">Project Conflict</h3>
                        </div>

                        <p className="text-[#9ba2c0] mb-6">
                            A project with ID <code className="text-[#f5f7ff] bg-white/10 px-1 rounded">{importData.project.id.slice(0, 8)}...</code> already exists on this device.
                        </p>

                        <div className="space-y-3">
                            <button
                                onClick={() => executeImport(importData, 'CREATE_NEW')}
                                className="w-full flex items-center justify-between p-4 rounded-xl bg-[#11182b] border border-[#1d2440] hover:border-[#56ccf2] group transition text-left"
                            >
                                <div>
                                    <div className="font-bold text-[#f5f7ff] group-hover:text-[#56ccf2]">Import as New Copy</div>
                                    <div className="text-xs text-[#9ba2c0]">Create a duplicate with new IDs. Safer.</div>
                                </div>
                                <Copy size={24} className="text-[#56ccf2]" />
                            </button>

                            <button
                                onClick={() => executeImport(importData, 'REPLACE')}
                                className="w-full flex items-center justify-between p-4 rounded-xl bg-[#11182b] border border-[#1d2440] hover:border-[#ff7e67] group transition text-left"
                            >
                                <div>
                                    <div className="font-bold text-[#f5f7ff] group-hover:text-[#ff7e67]">Overwrite Existing</div>
                                    <div className="text-xs text-[#9ba2c0]">Replace local data with this file.</div>
                                </div>
                                <FileArrowUp size={24} className="text-[#ff7e67]" />
                            </button>
                        </div>

                        <button
                            onClick={() => { setImportData(null); setImportConflict(false); }}
                            className="mt-6 w-full py-3 text-sm font-medium text-[#9ba2c0] hover:text-white"
                        >
                            Cancel Import
                        </button>
                    </div>
                </div>
            )}

            {/* Creation Mode */}
            {isCreating && (
                <div className="glass-panel p-6 rounded-xl border border-primary/20 animate-in fade-in slide-in-from-top-4">
                    <h3 className="text-lg font-semibold mb-4">Create New Project</h3>
                    <CreateProjectForm
                        onSuccess={() => setIsCreating(false)}
                        onCancel={() => setIsCreating(false)}
                    />
                </div>
            )}

            {/* Search & List */}
            <div className="space-y-6">
                <div className="max-w-md">
                    <Input
                        placeholder="Search projects..."
                        leftIcon={<MagnifyingGlass size={18} />}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                {projects.length === 0 ? (
                    <div className="text-center py-20 border border-dashed border-border rounded-xl">
                        <p className="text-text-muted mb-4">No projects found.</p>
                        <Button variant="secondary" onClick={() => setIsCreating(true)}>
                            Create your first project
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredProjects.map((project) => (
                            <ProjectCard
                                key={project.id}
                                project={project}
                                onClick={() => navigate(`/projects/${project.id}`)}
                                onDelete={(e) => handleDeleteProject(e, project.id)}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};