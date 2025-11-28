import React from 'react';
import { clsx } from 'clsx';
import type { LucideIcon } from 'lucide-react';

interface HoloStatProps {
    label: string;
    value: number | string;
    unit: string;
    icon: LucideIcon;
    colorClass: string;
    borderClass: string;
}

export const HoloStat: React.FC<HoloStatProps> = ({ label, value, unit, icon: Icon, colorClass, borderClass }) => (
    <div className="relative overflow-hidden rounded-2xl bg-panel-soft/50 border border-border p-5 flex flex-col justify-between group hover:border-primary/30 transition-all duration-500 hover:shadow-lg">
        {/* Ambient Glow */}
        <div className={clsx("absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 bg-gradient-to-br", colorClass)} style={{ opacity: 0.05 }} />

        <div className="flex justify-between items-start mb-3 relative z-10">
            <div className={clsx("p-2 rounded-xl bg-panel border border-border text-text-muted transition-colors", borderClass)}>
                <Icon size={20} strokeWidth={1.5} />
            </div>
        </div>

        <div className="relative z-10">
            <div className="text-3xl font-black text-text-main tracking-tighter mb-0.5">
                {value}
            </div>
            <div className="text-[9px] font-bold uppercase tracking-[0.2em] text-text-muted">
                {label} <span className="opacity-50 ml-1">{unit}</span>
            </div>
        </div>
    </div>
);
