import React, { useState } from 'react';
import { useRepositories } from '../hooks/useRepositories';
import { ProjectCard } from '../components/projects/ProjectCard';
import { CreateProjectForm } from '../components/projects/CreateProjectForm';
import { Button } from '../components/ui/Button';
import { Plus, MagnifyingGlass, UploadSimple } from 'phosphor-react';
import { Input } from '../components/ui/Input';
import { useNavigate } from 'react-router-dom';
import { importProject } from '../utils/sync/import';

export const ProjectsPage: React.FC = () => {
    const { projects } = useRepositories();
    const navigate = useNavigate();
    const [isCreating, setIsCreating] = useState(false);
    const [search, setSearch] = useState('');

    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const projectId = await importProject(file);
            // Refresh logic might be needed if useRepositories doesn't auto-update
            // But useLiveQuery in hooks should handle it.
            navigate(`/projects/${projectId}`);
        } catch (error) {
            console.error('Import failed:', error);
            alert('Failed to import project');
        } finally {
            e.target.value = ''; // Reset input
        }
    };

    const filteredProjects = projects.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-8">
            {/* Header Actions */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-text-main">Projects</h2>
                    <p className="text-text-muted">Manage your environmental surveys.</p>
                </div>
                <div className="flex gap-2">
                    <input
                        type="file"
                        id="import-project"
                        className="hidden"
                        accept=".json"
                        onChange={handleImport}
                    />
                    <Button
                        variant="secondary"
                        leftIcon={<UploadSimple size={18} />}
                        onClick={() => document.getElementById('import-project')?.click()}
                    >
                        Import
                    </Button>
                    <Button onClick={() => setIsCreating(true)} leftIcon={<Plus size={18} />}>
                        New Project
                    </Button>
                </div>
            </div>

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
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
