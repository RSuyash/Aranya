import React from 'react';
import type { Project } from '../../core/data-model/types';
import { Folder, Calendar, Trash } from 'phosphor-react';

interface ProjectCardProps {
    project: Project;
    onClick?: () => void;
    onDelete?: (e: React.MouseEvent) => void;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ project, onClick, onDelete }) => {
    return (
        <div
            onClick={onClick}
            className="glass-panel p-5 rounded-xl hover:border-primary/50 transition-all cursor-pointer group relative flex flex-col justify-between min-h-[180px]"
        >
            <div>
                <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-primary/10 text-primary rounded-lg">
                        <Folder size={24} weight="duotone" />
                    </div>

                    {onDelete && (
                        <button
                            onClick={onDelete}
                            className="p-2 text-[#9ba2c0] hover:text-[#ff7e67] hover:bg-[#ff7e67]/10 rounded-full transition-all opacity-0 group-hover:opacity-100"
                            title="Delete Project"
                        >
                            <Trash size={20} />
                        </button>
                    )}
                </div>

                <h3 className="text-lg font-semibold text-text-main mb-1 group-hover:text-primary transition-colors line-clamp-1">
                    {project.name}
                </h3>
                <p className="text-sm text-text-muted line-clamp-2 mb-4">
                    {project.description || 'No description provided.'}
                </p>
            </div>

            <div className="flex items-center gap-2 text-xs text-text-muted border-t border-white/5 pt-4 mt-auto">
                <Calendar size={14} />
                <span>Updated {new Date(project.updatedAt).toLocaleDateString()}</span>
            </div>
        </div>
    );
};