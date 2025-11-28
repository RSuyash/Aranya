import React from 'react';
import { clsx } from 'clsx';
import type { LucideIcon } from 'lucide-react';

interface TechSeparatorProps {
    label: string;
    icon: LucideIcon;
    color?: string;
}

export const TechSeparator: React.FC<TechSeparatorProps> = ({ label, icon: Icon, color = "text-primary" }) => (
    <div className="flex items-center gap-3 py-4 select-none group">
        <div className={clsx("p-1.5 rounded-lg bg-panel-soft border border-border group-hover:border-primary/30 transition-colors", color)}>
            <Icon size={14} strokeWidth={2} />
        </div>
        <span className={clsx("text-[10px] font-bold uppercase tracking-[0.2em]", color)}>
            {label}
        </span>
        <div className="flex-1 h-px bg-gradient-to-r from-border/50 to-transparent relative">
            <div className={clsx("absolute left-0 top-1/2 -translate-y-1/2 w-8 h-px opacity-50", color.replace('text-', 'bg-'))} />
        </div>
    </div>
);
