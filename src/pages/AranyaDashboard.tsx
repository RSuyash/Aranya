import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useRepositories } from '../hooks/useRepositories';
import { TreePine, Plus, Map, ArrowRight, BarChart3, Download, Upload } from 'lucide-react';
import { exportProject, downloadBlob } from '../utils/sync/export';
import { exportTidyCSV } from '../utils/export/tidyDataExport';
import { ImportWizardModal } from '../components/import-wizard/ImportWizardModal';

const AranyaDashboard: React.FC = () => {
    const { projectId } = useParams<{ projectId: string }>();
    const navigate = useNavigate();
    const { projects, useModules, usePlots, useTreeObservations } = useRepositories();
    const [showImport, setShowImport] = useState(false);

    const project = projects?.find(p => p.id === projectId);
    const modules = useModules(projectId);
    const plots = usePlots(projectId);
    const trees = useTreeObservations(projectId);

    if (!project) {
        return (
            <div className="min-h-screen bg-[#050814] flex items-center justify-center">
                <div className="text-white text-lg">Loading project...</div>
            </div>
        );
    }

    // Calculate stats based on active modules to ensure consistency
    const activeModuleIds = new Set(modules.map(m => m.id));
    const activePlots = plots.filter(p => activeModuleIds.has(p.moduleId));

    const totalPlots = activePlots.length;
    const completedPlots = activePlots.filter(p => p.status === 'COMPLETED').length;
    const totalTrees = trees.length;
    const speciesCount = new Set(trees.map(t => t.speciesName)).size;

    const handleExport = async () => {
        if (!project) return;
        try {
            // 1. Generate the Blob
            const blob = await exportProject(project.id);

            // 2. Create a clean filename (e.g., "western_ghats_survey_2023-10-27.json")
            const dateStr = new Date().toISOString().split('T')[0];
            const safeName = project.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
            const filename = `${safeName}_export_${dateStr}.json`;

            // 3. Trigger Download
            downloadBlob(blob, filename);
        } catch (error) {
            console.error('Export failed:', error);
            alert('Failed to generate export package. Check console for details.');
        }
    };

    const handleExportTidyCSV = async () => {
        if (!project) return;
        try {
            const blob = await exportTidyCSV(project.id, 'separate_rows');
            const filename = `${project.name.replace(/\s+/g, '_')}_tidy_${new Date().toISOString().split('T')[0]}.csv`;

            // Use a different download function or adapt the existing one
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Tidy CSV export failed:', error);
            alert('Failed to generate tidy CSV export. Check console for details.');
        }
    };

    return (
        <div className="min-h-full flex flex-col space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-[#f5f7ff]">{project.name}</h1>
                    <p className="text-sm text-[#9ba2c0] mt-1">{project.description}</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowImport(true)}
                        className="flex items-center gap-2 bg-[#1d2440] hover:bg-[#2a3454] text-[#f2c94c] border border-[#f2c94c]/30 px-4 py-2 rounded-lg transition-all text-sm font-medium"
                    >
                        <Upload className="w-4 h-4" />
                        Import CSV
                    </button>
                    <button
                        onClick={() => navigate(`/projects/${projectId}/settings`)}
                        className="px-4 py-2 bg-[#56ccf2] text-[#050814] rounded-lg font-medium hover:bg-[#4ab8de] transition shadow-lg shadow-[#56ccf2]/20"
                    >
                        Project Settings
                    </button>
                </div>
            </div>

            {/* Import Wizard Modal */}
            {showImport && (
                <ImportWizardModal
                    currentUserId={project.ownerId}
                    onClose={() => setShowImport(false)}
                />
            )}

            {/* Main Content */}
            <main className="flex-1">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <StatCard label="Total Plots" value={totalPlots} />
                    <StatCard label="Completed" value={completedPlots} />
                    <StatCard label="Trees Recorded" value={totalTrees} />
                    <StatCard label="Species" value={speciesCount} />
                </div>

                {/* Modules Section */}
                <section className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold text-[#f5f7ff]">Active Modules</h2>
                    </div>

                    {modules.length === 0 ? (
                        <div className="bg-[#0b1020] border border-[#1d2440] rounded-2xl p-8 text-center">
                            <TreePine className="w-12 h-12 mx-auto mb-4 text-[#56ccf2]" />
                            <h3 className="text-lg font-medium mb-2">No modules enabled</h3>
                            <p className="text-[#9ba2c0] mb-4">Enable modules in Project Settings to start collecting data</p>
                            <button
                                onClick={() => navigate(`/projects/${projectId}/settings`)}
                                className="px-4 py-2 bg-[#56ccf2] text-[#050814] rounded-lg font-medium hover:bg-[#4ab8de] transition"
                            >
                                Go to Settings
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {modules.map(module => {
                                const modulePlots = plots.filter(p => p.moduleId === module.id);
                                const moduleCompleted = modulePlots.filter(p => p.status === 'COMPLETED').length;
                                const progress = modulePlots.length > 0 ? Math.round((moduleCompleted / modulePlots.length) * 100) : 0;

                                return (
                                    <div
                                        key={module.id}
                                        className="bg-[#0b1020] border border-[#1d2440] rounded-2xl p-6 hover:border-[#56ccf2] transition cursor-pointer"
                                        onClick={() => navigate(`/project/${projectId}/module/${module.id}`)}
                                    >
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-[#56ccf2]/20 rounded-xl flex items-center justify-center">
                                                    <TreePine className="w-5 h-5 text-[#56ccf2]" />
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold text-[#f5f7ff]">{module.name}</h3>
                                                    <p className="text-xs text-[#9ba2c0]">{module.type}</p>
                                                </div>
                                            </div>
                                            <ArrowRight className="w-5 h-5 text-[#9ba2c0]" />
                                        </div>

                                        {/* Progress */}
                                        <div className="mb-3">
                                            <div className="flex items-center justify-between text-xs text-[#9ba2c0] mb-1">
                                                <span>Field Completion</span>
                                                <span>{progress}%</span>
                                            </div>
                                            <div className="h-2 bg-[#050814] rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-gradient-to-r from-[#56ccf2] to-[#52d273] transition-all"
                                                    style={{ width: `${progress}%` }}
                                                />
                                            </div>
                                        </div>

                                        {/* Stats */}
                                        <div className="flex items-center gap-4 text-xs text-[#9ba2c0]">
                                            <span>{modulePlots.length} plots</span>
                                            <span>·</span>
                                            <span>{moduleCompleted} completed</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>

                {/* Quick Actions */}
                <section>
                    <h2 className="text-xl font-semibold text-[#f5f7ff] mb-4">Quick Actions</h2>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <ActionCard
                            icon={<Map className="w-6 h-6" />}
                            title="View Map"
                            description="See all plots on map"
                            onClick={() => navigate('/map')}
                        />
                        <ActionCard
                            icon={<BarChart3 className="w-6 h-6" />}
                            title="Analysis"
                            description="Generate reports"
                            onClick={() => navigate(`/projects/${projectId}/analysis`)}
                        />
                        <ActionCard
                            icon={<TreePine className="w-6 h-6" />}
                            title="Export Data"
                            description="Download JSON Backup"
                            onClick={handleExport}
                        />
                        <ActionCard
                            icon={<Download className="w-6 h-6" />}
                            title="Export CSV"
                            description="Tidy Format for R/Python"
                            onClick={handleExportTidyCSV}
                        />
                    </div>
                </section>
            </main>
        </div>
    );
};

// Stat Card Component
const StatCard: React.FC<{ label: string; value: number }> = ({ label, value }) => (
    <div className="bg-[#0b1020] border border-[#1d2440] rounded-2xl p-4">
        <div className="text-xs uppercase tracking-wider text-[#9ba2c0] mb-1">{label}</div>
        <div className="text-2xl font-bold text-[#f5f7ff]">{value}</div>
    </div>
);

// Action Card Component
const ActionCard: React.FC<{
    icon: React.ReactNode;
    title: string;
    description: string;
    onClick: () => void;
}> = ({ icon, title, description, onClick }) => (
    <button
        onClick={onClick}
        className="bg-[#0b1020] border border-[#1d2440] rounded-2xl p-6 text-left hover:border-[#56ccf2] transition"
    >
        <div className="w-12 h-12 bg-[#56ccf2]/20 rounded-xl flex items-center justify-center mb-4 text-[#56ccf2]">
            {icon}
        </div>
        <h3 className="font-semibold text-[#f5f7ff] mb-1">{title}</h3>
        <p className="text-sm text-[#9ba2c0]">{description}</p>
    </button>
);

export default AranyaDashboard;