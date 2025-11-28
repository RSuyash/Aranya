import React from 'react';
import {
    Satellite, AlertTriangle,
    CheckCircle2, MapPin, Crosshair
} from 'lucide-react';
import { clsx } from 'clsx';
import type { GPSState } from '../../../../../core/gps/types';

// --- MICRO COMPONENT: SIGNAL BARS ---
const SignalMeter = ({ accuracy }: { accuracy: number }) => {
    // Logic: <5m = 4 bars, <10m = 3 bars, <20m = 2 bars, >20m = 1 bar
    const bars = accuracy === 0 ? 0 : accuracy <= 5 ? 4 : accuracy <= 10 ? 3 : accuracy <= 20 ? 2 : 1;
    const color = bars >= 3 ? 'bg-success' : bars === 2 ? 'bg-warning' : 'bg-danger';

    return (
        <div className="flex gap-0.5 items-end h-4">
            {[1, 2, 3, 4].map(i => (
                <div
                    key={i}
                    className={clsx(
                        "w-1 rounded-sm transition-all duration-300",
                        i <= bars ? color : "bg-black/10 dark:bg-white/10", // Adaptive empty state
                        i === 1 ? "h-1.5" : i === 2 ? "h-2" : i === 3 ? "h-3" : "h-4"
                    )}
                />
            ))}
        </div>
    );
};

interface GPSStatusCardProps {
    gps: GPSState;
    className?: string;
}

export const GPSStatusCard: React.FC<GPSStatusCardProps> = ({ gps, className }) => {
    const { status, location, error, satelliteCount } = gps;

    const hasFix = !!location;
    const isLocked = status === 'LOCKED';
    const isSearching = ['INITIALIZING', 'SEARCHING', 'REQUESTING_PERMISSION'].includes(status);
    const isError = status === 'ERROR' || status === 'PERMISSION_DENIED';

    const accuracy = location?.accuracy || 0;
    const accuracyDisplay = hasFix ? `±${accuracy.toFixed(1)}m` : '--';

    return (
        <div className={clsx(
            "relative w-full overflow-hidden transition-all duration-300 bg-transparent",
            className
        )}>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">

                {/* LEFT: Primary Status */}
                <div className="flex items-center gap-3 min-w-0">
                    <div className={clsx(
                        "relative flex items-center justify-center w-12 h-12 rounded-xl border shrink-0 transition-colors shadow-sm",
                        isError ? "bg-danger/10 border-danger/20 text-danger" :
                            isLocked ? "bg-success/10 border-success/20 text-success" :
                                "bg-primary/10 border-primary/20 text-primary"
                    )}>
                        {isError ? <AlertTriangle size={20} /> :
                            isLocked ? <CheckCircle2 size={20} /> :
                                <Crosshair size={20} className={isSearching ? "animate-[spin_3s_linear_infinite]" : ""} />}

                        {isSearching && !isLocked && !isError && (
                            <div className="absolute inset-0 rounded-xl border border-primary/40 animate-ping" />
                        )}
                    </div>

                    <div className="flex flex-col truncate">
                        <div className="flex items-center gap-2">
                            <span className={clsx(
                                "text-sm font-bold uppercase tracking-wider truncate",
                                isError ? "text-danger" : isLocked ? "text-success" : "text-primary"
                            )}>
                                {isError ? "GPS Error" : isLocked ? "Signal Locked" : "Acquiring..."}
                            </span>
                        </div>

                        <div className="flex items-center gap-3 text-xs text-text-muted font-mono mt-0.5">
                            <span className="flex items-center gap-1">
                                <MapPin size={12} className="opacity-70" />
                                {hasFix ?
                                    `${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)}` :
                                    "Waiting for location..."}
                            </span>
                        </div>
                    </div>
                </div>

                {/* RIGHT: Telemetry Stats */}
                <div className="flex items-center gap-6 sm:pl-6 sm:border-l border-border w-full sm:w-auto justify-between sm:justify-end">

                    <div className="flex flex-col items-start sm:items-end">
                        <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider">Sats</span>
                        <div className="flex items-center gap-1 text-sm font-mono text-text-main font-bold">
                            <Satellite size={14} className={satelliteCount > 3 ? "text-primary" : "text-warning"} />
                            {satelliteCount}
                        </div>
                    </div>

                    <div className="flex flex-col items-end">
                        <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider mb-0.5">Precision</span>
                        <div className="flex items-center gap-2">
                            <span className={clsx(
                                "text-sm font-mono font-bold",
                                accuracy <= 5 ? "text-success" : accuracy <= 20 ? "text-primary" : "text-warning"
                            )}>
                                {accuracyDisplay}
                            </span>
                            <SignalMeter accuracy={accuracy} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Error Message Overlay */}
            {isError && error && (
                <div className="mt-3 p-3 rounded-lg bg-danger/10 border border-danger/20 text-xs text-danger font-medium flex items-center gap-2">
                    <AlertTriangle size={12} />
                    {error}
                </div>
            )}
        </div>
    );
};