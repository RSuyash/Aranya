import React from 'react';
import type { Project } from '../../db/schema';
import { Folder, Calendar, DotsThreeVertical } from 'phosphor-react';

interface ProjectCardProps {
    project: Project;
    onClick?: () => void;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ project, onClick }) => {
    return (
        <div
            onClick={onClick}
            className="glass-panel p-5 rounded-xl hover:border-primary/50 transition-all cursor-pointer group relative"
        >
            <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-primary/10 text-primary rounded-lg">
                    <Folder size={24} weight="duotone" />
                </div>
                <button className="text-text-muted hover:text-text-main p-1 rounded-full hover:bg-white/5">
                    <DotsThreeVertical size={24} />
                </button>
            </div>

            <h3 className="text-lg font-semibold text-text-main mb-1 group-hover:text-primary transition-colors">
                {project.name}
            </h3>
            <p className="text-sm text-text-muted line-clamp-2 mb-4 h-10">
                {project.description || 'No description provided.'}
            </p>

            <div className="flex items-center gap-2 text-xs text-text-muted border-t border-white/5 pt-4">
                <Calendar size={14} />
                <span>Updated {new Date(project.updatedAt).toLocaleDateString()}</span>
            </div>
        </div>
    );
};
