import React from 'react';
import { Tree, Bird, Drop, Mountains } from 'phosphor-react';
import { ModuleCard } from '../components/ModuleCard';
import { useNavigate } from 'react-router-dom';

export const DashboardPage: React.FC = () => {
    const navigate = useNavigate();

    const modules = [
        {
            id: 'vegetation',
            title: 'Vegetation Plots',
            icon: Tree,
            status: 'active' as const,
            progress: 35,
            count: '12/40 Plots',
            path: '/projects/vegetation',
        },
        {
            id: 'birds',
            title: 'Bird Surveys',
            icon: Bird,
            status: 'coming-soon' as const,
        },
        {
            id: 'water',
            title: 'Water Quality',
            icon: Drop,
            status: 'coming-soon' as const,
        },
        {
            id: 'soil',
            title: 'Soil Analysis',
            icon: Mountains,
            status: 'coming-soon' as const,
        },
    ];

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-2xl font-bold text-text-main">Project Dashboard</h2>
                <p className="text-text-muted mt-1">Select a module to begin data collection.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {modules.map((module) => (
                    <ModuleCard
                        key={module.id}
                        title={module.title}
                        icon={module.icon}
                        status={module.status}
                        progress={module.progress}
                        count={module.count}
                        onClick={() => module.status === 'active' && navigate(module.path)}
                    />
                ))}
            </div>
        </div>
    );
};
