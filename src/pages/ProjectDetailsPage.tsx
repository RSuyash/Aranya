import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useRepositories } from '../hooks/useRepositories';
import { Button } from '../components/ui/Button';
import { Plus, ArrowLeft, MapTrifold, Tree, DotsThreeVertical, DownloadSimple, Table } from 'phosphor-react';
import { Input } from '../components/ui/Input';
import { exportProject, downloadBlob } from '../utils/sync/export';
import { exportTidyCSV } from '../utils/export/tidyDataExport';

export const ProjectDetailsPage: React.FC = () => {
    const { projectId } = useParams<{ projectId: string }>();
    const navigate = useNavigate();
    const { projects, usePlots, addPlot } = useRepositories();

    const project = projects?.find(p => p.id === projectId);
    const plots = usePlots(projectId);

    const [isAddingPlot, setIsAddingPlot] = useState(false);
    const [newPlotName, setNewPlotName] = useState('');
    const [showExportMenu, setShowExportMenu] = useState(false);

    if (!project) {
        return (
            <div className="flex flex-col items-center justify-center h-[50vh] text-text-muted">
                <p>Project not found</p>
                <Button variant="ghost" onClick={() => navigate('/projects')} className="mt-4">
                    Return to Projects
                </Button>
            </div>
        );
    }

    const handleAddPlot = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newPlotName.trim() || !projectId) return;

        await addPlot(projectId, 'vegetation', newPlotName);
        setNewPlotName('');
        setIsAddingPlot(false);
    };

    const handleExportJSON = async () => {
        if (!project) return;
        try {
            const blob = await exportProject(project.id);
            const filename = `${project.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.json`;
            downloadBlob(blob, filename);
            setShowExportMenu(false);
        } catch (error) {
            console.error('Export failed:', error);
            alert('Failed to export project');
        }
    };

    const handleExportTidyCSV = async () => {
        if (!project) return;
        try {
            const blob = await exportTidyCSV(project.id, 'separate_rows');
            const filename = `${project.name.replace(/\s+/g, '_')}_tidy_${new Date().toISOString().split('T')[0]}.csv`;
            downloadBlob(blob, filename);
            setShowExportMenu(false);
        } catch (error) {
            console.error('Tidy export failed:', error);
            alert('Failed to export tidy CSV');
        }
    };

    return (
        <div className="space-y-8 pb-20">
            {/* Header Section */}
            <div className="flex flex-col gap-6">
                <Button
                    variant="ghost"
                    onClick={() => navigate('/projects')}
                    leftIcon={<ArrowLeft size={20} />}
                    className="self-start -ml-2 text-text-muted hover:text-text-main"
                >
                    Back to Projects
                </Button>

                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-bold text-text-main mb-2">{project.name}</h1>
                        <p className="text-text-muted max-w-2xl text-lg leading-relaxed">
                            {project.description || 'No description provided for this survey.'}
                        </p>
                    </div>
                    <div className="flex gap-2 relative">
                        <div className="relative">
                            <Button
                                variant="secondary"
                                leftIcon={<DownloadSimple size={20} />}
                                onClick={() => setShowExportMenu(!showExportMenu)}
                            >
                                Export
                            </Button>

                            {showExportMenu && (
                                <div className="absolute right-0 top-12 w-64 bg-[#0b1020] border border-[#1d2440] rounded-lg shadow-2xl z-50 overflow-hidden">
                                    <button
                                        onClick={handleExportTidyCSV}
                                        className="w-full px-4 py-3 text-left hover:bg-[#1d2440] transition-colors flex items-center gap-3 border-b border-[#1d2440]"
                                    >
                                        <Table size={20} className="text-[#56ccf2]" />
                                        <div>
                                            <div className="text-sm font-medium text-[#f5f7ff]">Tidy CSV</div>
                                            <div className="text-xs text-[#9ba2c0]">For R/Python analysis</div>
                                        </div>
                                    </button>
                                    <button
                                        onClick={handleExportJSON}
                                        className="w-full px-4 py-3 text-left hover:bg-[#1d2440] transition-colors flex items-center gap-3"
                                    >
                                        <DownloadSimple size={20} className="text-[#9ba2c0]" />
                                        <div>
                                            <div className="text-sm font-medium text-[#f5f7ff]">Project JSON</div>
                                            <div className="text-xs text-[#9ba2c0]">Full project backup</div>
                                        </div>
                                    </button>
                                </div>
                            )}
                        </div>
                        <Button variant="secondary" leftIcon={<DotsThreeVertical size={20} />}>
                            Options
                        </Button>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass-panel p-6 rounded-2xl flex items-center gap-5 border-l-4 border-l-primary">
                    <div className="p-4 bg-primary/10 text-primary rounded-xl">
                        <MapTrifold size={32} weight="duotone" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-text-muted uppercase tracking-wider">Total Plots</p>
                        <p className="text-3xl font-bold text-text-main mt-1">{plots.length}</p>
                    </div>
                </div>

                <div className="glass-panel p-6 rounded-2xl flex items-center gap-5 border-l-4 border-l-success">
                    <div className="p-4 bg-success/10 text-success rounded-xl">
                        <Tree size={32} weight="duotone" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-text-muted uppercase tracking-wider">Total Trees</p>
                        <p className="text-3xl font-bold text-text-main mt-1">0</p>
                    </div>
                </div>
            </div>

            {/* Plots Section */}
            <div className="space-y-6">
                <div className="flex justify-between items-center border-b border-border pb-4">
                    <h2 className="text-xl font-semibold text-text-main flex items-center gap-2">
                        Survey Plots
                        <span className="bg-panel-soft text-text-muted text-xs px-2 py-1 rounded-full">
                            {plots.length}
                        </span>
                    </h2>
                    <Button onClick={() => setIsAddingPlot(true)} leftIcon={<Plus size={18} />}>
                        New Plot
                    </Button>
                </div>

                {isAddingPlot && (
                    <form
                        onSubmit={handleAddPlot}
                        className="glass-panel p-6 rounded-xl flex flex-col md:flex-row gap-4 items-end animate-in fade-in slide-in-from-top-2 border border-primary/30 shadow-lg shadow-primary/5"
                    >
                        <div className="flex-1 w-full">
                            <Input
                                label="Plot Name / ID"
                                placeholder="e.g. Plot A-1 (North Quadrant)"
                                value={newPlotName}
                                onChange={(e) => setNewPlotName(e.target.value)}
                                autoFocus
                            />
                        </div>
                        <div className="flex gap-3 w-full md:w-auto">
                            <Button type="button" variant="ghost" onClick={() => setIsAddingPlot(false)} className="flex-1 md:flex-none">
                                Cancel
                            </Button>
                            <Button type="submit" className="flex-1 md:flex-none">
                                Create Plot
                            </Button>
                        </div>
                    </form>
                )}

                {plots.length === 0 && !isAddingPlot ? (
                    <div className="text-center py-24 border-2 border-dashed border-border rounded-2xl bg-panel/30">
                        <div className="inline-flex p-4 bg-panel rounded-full text-text-muted mb-4">
                            <MapTrifold size={32} weight="light" />
                        </div>
                        <h3 className="text-lg font-medium text-text-main mb-2">No plots added yet</h3>
                        <p className="text-text-muted mb-6 max-w-sm mx-auto">
                            Start your survey by adding 20x20m plots to this project.
                        </p>
                        <Button variant="secondary" onClick={() => setIsAddingPlot(true)}>
                            Add Your First Plot
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {plots.map(plot => (
                            <div
                                key={plot.id}
                                className="glass-panel p-5 rounded-xl hover:border-primary/50 cursor-pointer transition-all duration-200 hover:shadow-lg hover:shadow-primary/5 group relative overflow-hidden"
                                onClick={() => navigate(`/map?plotId=${plot.id}`)}
                            >
                                <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <ArrowLeft size={20} className="rotate-180 text-primary" />
                                </div>

                                <div className="flex justify-between items-start mb-3">
                                    <div className="p-2 bg-panel-soft rounded-lg text-text-muted group-hover:text-text-main transition-colors">
                                        <MapTrifold size={24} />
                                    </div>
                                    <span className="text-xs font-medium bg-primary/10 text-primary px-2.5 py-1 rounded-full border border-primary/20">
                                        20x20m
                                    </span>
                                </div>

                                <h4 className="text-lg font-semibold text-text-main mb-1 group-hover:text-primary transition-colors">
                                    {plot.name}
                                </h4>
                                <p className="text-sm text-text-muted">Vegetation Module</p>

                                <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center text-xs text-text-muted">
                                    <span>0 Trees</span>
                                    <span>Updated just now</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
