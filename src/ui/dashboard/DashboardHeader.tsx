import React from 'react';

interface DashboardHeaderProps {
    projectCount: number;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({ projectCount }) => (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border pb-6 mb-8">
        <div>
            <h1 className="text-3xl font-bold text-text-main tracking-tight">
                Overview
            </h1>
            <p className="text-text-muted mt-2 max-w-2xl">
                System status and global metrics across all active environmental monitoring projects.
            </p>
        </div>
        <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
                <div className="text-xs uppercase tracking-wider text-text-muted font-bold">Total Projects</div>
                <div className="text-2xl font-mono font-bold text-text-main leading-none mt-1">
                    {projectCount.toString().padStart(2, '0')}
                </div>
            </div>
        </div>
    </div>
);
