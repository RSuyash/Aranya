import React from 'react';
import { Loader2, Satellite, Signal, AlertTriangle, Lock } from 'lucide-react';
import { clsx } from 'clsx';
import type { GPSState } from '../../../../../core/gps/types';

interface GPSStatusCardProps {
    gps: GPSState;
}

export const GPSStatusCard: React.FC<GPSStatusCardProps> = ({ gps }) => {
    const { status, location, error } = gps;

    // Map internal status to UI themes
    const theme = {
        IDLE: 'SEARCHING',
        REQUESTING_PERMISSION: 'SEARCHING',
        INITIALIZING: 'SEARCHING',
        SEARCHING: 'SEARCHING',
        LOCKED: 'EXCELLENT',
        ERROR: 'ERROR',
        PERMISSION_DENIED: 'ERROR'
    }[status] || 'SEARCHING';

    const colors = {
        SEARCHING: 'border-border bg-panel-soft',
        ERROR: 'border-danger/30 bg-danger/10',
        EXCELLENT: 'border-success/30 bg-success/10'
    };

    const textColors = {
        SEARCHING: 'text-text-muted',
        ERROR: 'text-danger',
        EXCELLENT: 'text-success'
    };

    const StatusIcon = {
        SEARCHING: Loader2,
        ERROR: AlertTriangle,
        EXCELLENT: Lock
    }[theme as 'SEARCHING' | 'ERROR' | 'EXCELLENT'] || Loader2;

    return (
        <div className={clsx(
            "rounded-2xl p-5 border-2 transition-all duration-500 relative overflow-hidden",
            colors[theme as keyof typeof colors]
        )}>
            {/* Background Pulse Animation for Searching */}
            {theme === 'SEARCHING' && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#ffffff05] to-transparent animate-shimmer" />
            )}

            <div className="flex items-start justify-between mb-4 relative z-10">
                <div className="flex items-center gap-3">
                    <div className={clsx(
                        "w-10 h-10 rounded-full flex items-center justify-center border",
                        theme === 'SEARCHING' ? "border-border bg-panel" :
                            theme === 'EXCELLENT' ? "border-success bg-success/20" :
                                "border-danger bg-danger/20"
                    )}>
                        <StatusIcon className={clsx("w-5 h-5", theme === 'SEARCHING' && "animate-spin", textColors[theme as keyof typeof textColors])} />
                    </div>
                    <div>
                        <h4 className="text-text-main font-bold text-sm uppercase tracking-wider">GPS Signal</h4>
                        <p className={clsx("text-xs font-medium", textColors[theme as keyof typeof textColors])}>
                            {status === 'REQUESTING_PERMISSION' ? 'Requesting Access...' :
                                status === 'PERMISSION_DENIED' ? 'Permission Denied' :
                                    status === 'INITIALIZING' ? 'Starting GPS...' :
                                        status === 'SEARCHING' ? 'Acquiring Satellites...' :
                                            status === 'LOCKED' ? 'Signal Locked (High Precision)' :
                                                error || 'Signal Lost'}
                        </p>
                    </div>
                </div>

                {/* Signal Bars Visual */}
                <div className="flex gap-1 items-end h-6">
                    {[1, 2, 3, 4].map(bar => (
                        <div key={bar} className={clsx(
                            "w-1.5 rounded-sm transition-all duration-300",
                            bar === 1 ? "h-2" : bar === 2 ? "h-3" : bar === 3 ? "h-4" : "h-6",
                            theme === 'EXCELLENT' ? "bg-success" :
                                theme === 'SEARCHING' && bar <= 2 ? "bg-warning animate-pulse" :
                                    "bg-border"
                        )} />
                    ))}
                </div>
            </div>

            {/* Data Display */}
            {location ? (
                <div className="grid grid-cols-2 gap-4 relative z-10">
                    <div className="bg-app/50 rounded-xl p-3 border border-white/5">
                        <div className="text-[10px] text-text-muted uppercase mb-1 flex items-center gap-1">
                            <Satellite className="w-3 h-3" /> Coordinates
                        </div>
                        <div className="font-mono text-text-main font-medium text-sm truncate">
                            {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                        </div>
                    </div>
                    <div className="bg-app/50 rounded-xl p-3 border border-white/5">
                        <div className="text-[10px] text-text-muted uppercase mb-1 flex items-center gap-1">
                            <Signal className="w-3 h-3" /> Accuracy
                        </div>
                        <div className="flex items-baseline gap-1">
                            <span className={clsx("font-mono font-bold text-lg", textColors[theme as keyof typeof textColors])}>
                                ±{location.accuracy.toFixed(1)}
                            </span>
                            <span className="text-xs text-text-muted">meters</span>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="h-16 bg-app/30 rounded-xl animate-pulse border border-white/5 flex items-center justify-center text-text-muted text-xs">
                    Waiting for location data...
                </div>
            )}
        </div>
    );
};
