import React from 'react';
import { clsx } from 'clsx';
import { ArrowRight } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface Metric {
    label: string;
    value: string | number;
}

interface ModuleOverviewCardProps {
    title: string;
    description: string;
    icon: LucideIcon;
    metrics?: Metric[];
    onClick?: () => void;
    isActive?: boolean;
}

export const ModuleOverviewCard: React.FC<ModuleOverviewCardProps> = ({
    title,
    description,
    icon: Icon,
    metrics,
    onClick,
    isActive = false
}) => (
    <button
        onClick={onClick}
        disabled={!isActive}
        className={clsx(
            "w-full text-left relative overflow-hidden rounded-2xl border transition-all duration-300 group",
            isActive
                ? "bg-panel border-border hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5"
                : "bg-panel/50 border-border opacity-60 cursor-not-allowed"
        )}
    >
        {/* Header Section */}
        <div className="p-6 border-b border-border bg-panel-soft/50 flex justify-between items-start">
            <div className="flex gap-4">
                <div className={clsx(
                    "w-12 h-12 rounded-xl flex items-center justify-center transition-colors",
                    isActive ? "bg-primary/10 text-primary" : "bg-panel border border-border text-text-muted"
                )}>
                    <Icon size={24} strokeWidth={1.5} />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-text-main group-hover:text-primary transition-colors">
                        {title}
                    </h3>
                    <p className="text-sm text-text-muted max-w-sm mt-1 leading-relaxed">
                        {description}
                    </p>
                </div>
            </div>
            {isActive && (
                <div className="w-8 h-8 rounded-full border border-border flex items-center justify-center text-text-muted group-hover:bg-primary group-hover:border-primary group-hover:text-app transition-all">
                    <ArrowRight size={16} />
                </div>
            )}
        </div>

        {/* Real Data Grid Section */}
        {isActive && metrics && (
            <div className="p-6 grid grid-cols-3 gap-4">
                {metrics.map((m, i) => (
                    <div key={i}>
                        <div className="text-[10px] uppercase tracking-wider text-text-muted font-bold mb-1">
                            {m.label}
                        </div>
                        <div className="text-xl font-mono font-bold text-text-main">
                            {m.value}
                        </div>
                    </div>
                ))}
            </div>
        )}

        {!isActive && (
            <div className="p-6 flex items-center gap-2 text-xs font-bold text-text-muted uppercase tracking-wider">
                <div className="w-2 h-2 rounded-full bg-text-muted/30" />
                Module Inactive / Coming Soon
            </div>
        )}
    </button>
);
