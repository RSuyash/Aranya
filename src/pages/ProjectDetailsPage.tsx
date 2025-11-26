import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useRepositories } from '../hooks/useRepositories';
import { Button } from '../components/ui/Button';
import { MapTrifold, DotsThreeVertical, Table, ChartBar, Gear } from 'phosphor-react';
import { clsx } from 'clsx';
import { FieldDataContainer } from '../ui/modules/DataManagement/FieldDataContainer';
import { ProjectOverview } from '../ui/modules/Project/ProjectOverview';
import { DataManagementPanel } from '../ui/modules/DataManagement/DataManagementPanel';
import { useHeader } from '../context/HeaderContext';

type Tab = 'OVERVIEW' | 'DATA' | 'ANALYSIS' | 'MANAGE' | 'SETTINGS';

export const ProjectDetailsPage: React.FC = () => {
    const { projectId } = useParams<{ projectId: string }>();
    const navigate = useNavigate();
    const { projects } = useRepositories();
    const { setHeader } = useHeader();

    const project = projects?.find(p => p.id === projectId);
    const [activeTab, setActiveTab] = useState<Tab>('DATA'); // Default to DATA for now as requested

    useEffect(() => {
        setHeader({
            title: project ? project.name : 'Loading Project...',
            breadcrumbs: [
                { label: 'Terra', path: '/' },
                { label: 'Projects', path: '/projects' },
                { label: project?.name || 'Loading...', path: `/projects/${projectId}` }
            ],
            isLoading: !project,
            moduleColor: 'emerald',
            status: (
                <span className="flex items-center gap-2 text-[#56ccf2]">
                    <span className="w-2 h-2 rounded-full bg-[#56ccf2] animate-pulse" />
                    <span className="font-mono">Active</span>
                </span>
            ),
            actions: (
                <Button variant="ghost" leftIcon={<DotsThreeVertical size={20} />}>
                </Button>
            )
        });
    }, [project, projectId, setHeader]);

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

    return (
        <div className="h-full flex flex-col bg-[#050814]">
            {/* Page Toolbar / Tabs */}
            <div className="h-14 border-b border-[#1d2440] bg-[#0b1020]/50 flex items-center justify-between px-6 flex-shrink-0 z-10">
                <div className="flex items-center gap-1 bg-[#11182b] p-1 rounded-lg border border-[#1d2440]">
                    <button
                        onClick={() => setActiveTab('OVERVIEW')}
                        className={clsx(
                            "px-3 py-1.5 rounded-md text-sm font-medium transition flex items-center gap-2",
                            activeTab === 'OVERVIEW' ? "bg-[#1d2440] text-white shadow-sm" : "text-[#9ba2c0] hover:text-white"
                        )}
                    >
                        <MapTrifold size={16} />
                        <span className="hidden sm:inline">Overview</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('DATA')}
                        className={clsx(
                            "px-3 py-1.5 rounded-md text-sm font-medium transition flex items-center gap-2",
                            activeTab === 'DATA' ? "bg-[#1d2440] text-white shadow-sm" : "text-[#9ba2c0] hover:text-white"
                        )}
                    >
                        <Table size={16} />
                        <span className="hidden sm:inline">Field Data</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('ANALYSIS')}
                        className={clsx(
                            "px-3 py-1.5 rounded-md text-sm font-medium transition flex items-center gap-2",
                            activeTab === 'ANALYSIS' ? "bg-[#1d2440] text-white shadow-sm" : "text-[#9ba2c0] hover:text-white"
                        )}
                    >
                        <ChartBar size={16} />
                        <span className="hidden sm:inline">Analysis</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('MANAGE')}
                        className={clsx(
                            "px-3 py-1.5 rounded-md text-sm font-medium transition flex items-center gap-2",
                            activeTab === 'MANAGE' ? "bg-[#1d2440] text-white shadow-sm" : "text-[#9ba2c0] hover:text-white"
                        )}
                    >
                        <Gear size={16} />
                        <span className="hidden sm:inline">Manage</span>
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className={clsx(
                "flex-1 bg-[#050814] relative",
                activeTab === 'DATA' ? "overflow-hidden" : "overflow-y-auto p-6"
            )}>
                {activeTab === 'DATA' ? (
                    <FieldDataContainer projectId={projectId!} />
                ) : (
                    <div className="max-w-7xl mx-auto">
                        {activeTab === 'OVERVIEW' && <ProjectOverview projectId={projectId!} />}
                        {activeTab === 'ANALYSIS' && <div className="text-center text-gray-500 mt-20">Analysis Module Coming Soon</div>}
                        {activeTab === 'MANAGE' && <DataManagementPanel projectId={projectId!} />}
                        {activeTab === 'SETTINGS' && (
                            <div className="text-center text-gray-500 mt-20">Settings Form Placeholder</div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
