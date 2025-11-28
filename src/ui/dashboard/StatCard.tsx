import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
    label: string;
    value: number | string;
    icon: LucideIcon;
    subLabel?: string;
}

export const StatCard: React.FC<StatCardProps> = ({ label, value, icon: Icon, subLabel }) => (
    <div className="bg-panel border border-border rounded-xl p-5 flex flex-col justify-between hover:border-primary/30 transition-all duration-200">
        <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-panel-soft rounded-lg text-text-muted">
                <Icon size={20} />
            </div>
            {subLabel && (
                <span className="text-[10px] font-medium bg-primary/10 text-primary px-2 py-1 rounded-md border border-primary/20">
                    {subLabel}
                </span>
            )}
        </div>
        <div>
            <div className="text-3xl font-bold text-text-main tracking-tight font-mono">
                {value}
            </div>
            <div className="text-xs text-text-muted font-medium uppercase tracking-wider mt-1">
                {label}
            </div>
        </div>
    </div>
);
