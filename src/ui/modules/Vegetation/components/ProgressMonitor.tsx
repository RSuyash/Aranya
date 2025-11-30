import React from 'react';
import { Activity } from 'lucide-react';

interface ProgressMonitorProps {
    completed: number;
    total: number;
}

export const ProgressMonitor: React.FC<ProgressMonitorProps> = ({ completed, total }) => {
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

    return (
        <div className="relative p-5 rounded-2xl bg-panel-soft/50 border border-border overflow-hidden">
            {/* Background Mesh */}
            <div className="absolute inset-0 opacity-[0.05] text-text-muted"
                style={{ backgroundImage: 'linear-gradient(0deg, transparent 24%, currentColor 25%, currentColor 26%, transparent 27%, transparent 74%, currentColor 75%, currentColor 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, currentColor 25%, currentColor 26%, transparent 27%, transparent 74%, currentColor 75%, currentColor 76%, transparent 77%, transparent)', backgroundSize: '30px 30px' }}
            />

            <div className="flex justify-between items-end mb-3 relative z-10">
                <div className="flex items-center gap-2 text-primary">
                    <Activity size={16} className={percent < 100 ? "animate-pulse" : ""} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Survey Saturation</span>
                </div>
                <div className="text-2xl font-black text-text-main tracking-tight leading-none">
                    {percent}<span className="text-sm text-text-muted">%</span>
                </div>
            </div>

            <div className="relative h-2 w-full bg-panel rounded-full overflow-hidden border border-border">
                <div
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-blue-500 transition-all duration-1000 ease-out shadow-sm"
                    style={{ width: `${percent}%` }}
                />
            </div>

            <div className="flex justify-between mt-2 text-[9px] font-mono text-text-muted relative z-10">
                <span>Completed: {completed}</span>
                <span>Total Units: {total}</span>
            </div>
        </div>
    );
};