import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useRepositories } from '../hooks/useRepositories';
import { ArrowLeft, Check, Plus, Trash2 } from 'lucide-react';
import { db } from '../core/data-model/dexie';
import { VegetationSettingsForm } from '../ui/modules/Vegetation/VegetationSettingsForm';
import { useHeader } from '../context/HeaderContext';

export const ProjectSettingsPage: React.FC = () => {
    const { projectId } = useParams<{ projectId: string }>();
    const navigate = useNavigate();
    const { projects, useModules, addVegetationModule } = useRepositories();
    const { setHeader } = useHeader();

    const project = projects?.find(p => p.id === projectId);
    const modules = useModules(projectId);

    useEffect(() => {
        setHeader({
            title: 'Project Settings',
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

    if (!project) return <div className="p-8 text-white">Loading...</div>;

    const handleToggleModule = async (type: 'Vegetation Survey') => {
        const existingModule = modules.find(m => m.name === type);

        if (existingModule) {
            // If module exists, we might want to disable/archive it (future feature)
            // For now, maybe just show it's active
            alert("Module is already active.");
        } else {
            // Add new module
            await addVegetationModule(projectId!, type, {
                samplingMethod: 'SYSTEMATIC',
                status: 'ACTIVE'
            });
        }
    };

    const handleDeleteModule = async (moduleId: string) => {
        if (window.confirm('Are you sure? This will delete all plots and data associated with this module.')) {
            await db.modules.delete(moduleId);
            // Also delete associated plots/data (needs more robust cascading delete in real app)
            const plots = await db.plots.where('moduleId').equals(moduleId).toArray();
            for (const plot of plots) {
                await db.plots.delete(plot.id);
            }
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate(`/projects/${projectId}`)}
                    className="w-10 h-10 rounded-full bg-[#11182b] border border-[#1d2440] flex items-center justify-center text-[#9ba2c0] hover:text-[#f5f7ff] hover:border-[#56ccf2] transition"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-[#f5f7ff]">Project Settings</h1>
                    <p className="text-[#9ba2c0]">{project.name}</p>
                </div>
            </div>

            {/* Module Management */}
            <section className="bg-[#0b1020] border border-[#1d2440] rounded-2xl p-6">
                <h2 className="text-lg font-semibold text-[#f5f7ff] mb-4">Module Configuration</h2>
                <p className="text-sm text-[#9ba2c0] mb-6">
                    Enable or disable data collection modules for this project.
                </p>

                <div className="space-y-4">
                    {/* Vegetation Module */}
                    <div className="bg-[#050814] border border-[#1d2440] rounded-xl overflow-hidden transition-all">
                        <div className="flex items-center justify-between p-4">
                            <div>
                                <h3 className="font-medium text-[#f5f7ff]">Vegetation Survey</h3>
                                <p className="text-xs text-[#9ba2c0] mt-1">
                                    Plot-based vegetation sampling (Trees, Shrubs, Herbs)
                                </p>
                            </div>

                            {modules.some(m => m.name === 'Vegetation Survey') ? (
                                <div className="flex items-center gap-4">
                                    <span className="flex items-center gap-2 text-[#52d273] text-sm font-medium bg-[#0b2214] px-3 py-1.5 rounded-lg border border-[#21452b]">
                                        <Check className="w-4 h-4" />
                                        Active
                                    </span>
                                    <button
                                        onClick={() => handleDeleteModule(modules.find(m => m.name === 'Vegetation Survey')!.id)}
                                        className="p-2 text-[#9ba2c0] hover:text-[#ff7e67] transition"
                                        title="Remove Module"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={() => handleToggleModule('Vegetation Survey')}
                                    className="flex items-center gap-2 bg-[#11182b] text-[#f5f7ff] px-4 py-2 rounded-lg border border-[#1d2440] hover:border-[#56ccf2] transition"
                                >
                                    <Plus className="w-4 h-4" />
                                    Enable Module
                                </button>
                            )}
                        </div>

                        {/* Settings Area */}
                        {modules.find(m => m.name === 'Vegetation Survey') && (
                            <div className="border-t border-[#1d2440] bg-[#0b1020]/50 p-6">
                                <VegetationSettingsForm moduleId={modules.find(m => m.name === 'Vegetation Survey')!.id} />
                            </div>
                        )}
                    </div>

                    {/* Future Modules (Disabled UI) */}
                    <div className="flex items-center justify-between p-4 bg-[#050814]/50 border border-[#1d2440] rounded-xl opacity-60">
                        <div>
                            <h3 className="font-medium text-[#f5f7ff]">Soil Analysis</h3>
                            <p className="text-xs text-[#9ba2c0] mt-1">
                                Soil sample collection and chemical analysis
                            </p>
                        </div>
                        <span className="text-xs text-[#555b75] font-medium px-3 py-1.5 bg-[#11182b] rounded-lg border border-[#1d2440]">
                            Coming Soon
                        </span>
                    </div>

                    {/* Temporary Cleanup Tool */}
                    <div className="mt-8 pt-8 border-t border-[#1d2440]">
                        <h3 className="text-sm font-semibold text-[#ff7e67] mb-2">Troubleshooting</h3>
                        <button
                            onClick={async () => {
                                const vegModules = modules.filter(m => m.type === 'VEGETATION_PLOTS');
                                if (vegModules.length > 1) {
                                    if (window.confirm(`Found ${vegModules.length} duplicate modules. Fix automatically?`)) {
                                        for (const m of vegModules) {
                                            const count = await db.plots.where('moduleId').equals(m.id).count();
                                            if (count === 0) {
                                                await db.modules.delete(m.id);
                                            }
                                        }
                                        alert('Cleanup complete!');
                                    }
                                } else {
                                    alert('No duplicates found.');
                                }
                            }}
                            className="text-xs text-[#ff7e67] hover:text-[#ff9e8c] underline"
                        >
                            Fix Duplicate Modules
                        </button>
                    </div>
                </div>
            </section>
        </div>
    );
};
