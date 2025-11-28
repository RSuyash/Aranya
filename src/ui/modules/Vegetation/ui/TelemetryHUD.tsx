import React from 'react';
import { Maximize, Ruler } from 'lucide-react';
import { clsx } from 'clsx';

interface TelemetryHUDProps {
    plotCode: string;
    dimensions: { width: number; length: number };
    mode: 'DIGITIZE' | 'VIEW';
    scale: number;
}

export const TelemetryHUD: React.FC<TelemetryHUDProps> = ({ plotCode, dimensions, mode, scale }) => (
    <div className="absolute inset-0 pointer-events-none p-4 flex flex-col justify-between select-none overflow-hidden z-20">
        <div className="flex justify-between items-start">
            <div className="flex items-center gap-2 bg-panel/90 backdrop-blur-md border border-border px-3 py-1.5 rounded-full shadow-lg transition-all animate-in fade-in slide-in-from-top-2">
                <Maximize size={14} className="text-primary" />
                <span className="text-xs font-bold text-text-main">{plotCode}</span>
                <span className="h-3 w-px bg-border mx-1" />
                <span className="text-[10px] font-mono text-text-muted">
                    {dimensions.width}m × {dimensions.length}m
                </span>
            </div>

            <div className={clsx(
                "flex items-center gap-2 px-3 py-1.5 rounded-full border shadow-sm backdrop-blur-md transition-all font-mono text-xs",
                mode === 'DIGITIZE'
                    ? "bg-success/10 border-success/30 text-success font-bold"
                    : "bg-panel/80 border-border text-text-muted"
            )}>
                {mode === 'DIGITIZE' ? '● DIGITIZING' : 'VIEW ONLY'}
            </div>
        </div>

        <div className="flex justify-end animate-in fade-in slide-in-from-bottom-2">
            <div className="bg-panel/80 backdrop-blur-sm border border-border px-3 py-1.5 rounded-lg shadow-sm flex items-center gap-3">
                <Ruler size={14} className="text-text-muted" />
                <span className="text-xs font-mono text-text-main">1m ≈ {scale.toFixed(1)}px</span>
            </div>
        </div>
    </div>
);
