import React, { useEffect, useState } from 'react';
import { X, MapPin, Crosshair, CheckCircle, AlertTriangle } from 'lucide-react';
import { gpsManager } from '../../utils/gps/GPSManager';
import { clsx } from 'clsx';

interface GPSAveragingModalProps {
    onClose: () => void;
    onSave: (coords: { lat: number; lng: number; accuracy: number; samples: number }) => void;
}

export const GPSAveragingModal: React.FC<GPSAveragingModalProps> = ({ onClose, onSave }) => {
    const [stats, setStats] = useState<{
        lat: number;
        lng: number;
        accuracy: number;
        samples: number;
    }>({ lat: 0, lng: 0, accuracy: 0, samples: 0 });

    useEffect(() => {
        gpsManager.startMeasuring();
        const unsubscribe = gpsManager.subscribe((state) => {
            if (state.mode === 'MEASURING' && state.currentResult) {
                setStats(state.currentResult);
            }
        });
        return () => {
            unsubscribe();
            gpsManager.stopMeasuring();
        };
    }, []);

    const handleAccept = async () => {
        const result = await gpsManager.stopMeasuring();
        if (result) onSave(result);
        else if (stats.samples > 0) onSave(stats);
    };

    const getQualityColor = (acc: number) => {
        if (acc === 0) return 'text-text-muted';
        if (acc < 2) return 'text-success';
        if (acc < 5) return 'text-primary';
        return 'text-warning';
    };

    const isQualitySufficient = stats.samples >= 10 && stats.accuracy <= 5;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-panel border border-border rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden ring-1 ring-white/10">

                {/* Header */}
                <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-panel-soft/50">
                    <h3 className="font-bold text-text-main flex items-center gap-2">
                        <Crosshair className="w-5 h-5 text-primary" />
                        Precision GPS
                    </h3>
                    <button onClick={onClose} className="text-text-muted hover:text-text-main transition"><X size={20} /></button>
                </div>

                <div className="p-8 text-center space-y-8">
                    {/* Visualizer */}
                    <div className="relative w-32 h-32 mx-auto flex items-center justify-center">
                        <div className="absolute inset-0 bg-primary/10 rounded-full animate-ping" />
                        <div className="absolute inset-4 bg-primary/20 rounded-full animate-pulse" />
                        <div className="relative z-10 bg-panel border-4 border-primary w-20 h-20 rounded-full flex items-center justify-center shadow-[0_0_20px_var(--primary)]">
                            <MapPin className="w-8 h-8 text-primary" />
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-panel-soft p-4 rounded-2xl border border-border">
                            <div className="text-[10px] text-text-muted uppercase tracking-wider font-bold">Samples</div>
                            <div className="text-3xl font-mono font-black text-text-main tracking-tighter">
                                {stats.samples}
                            </div>
                        </div>
                        <div className="bg-panel-soft p-4 rounded-2xl border border-border">
                            <div className="text-[10px] text-text-muted uppercase tracking-wider font-bold">Error</div>
                            <div className={clsx("text-3xl font-mono font-black tracking-tighter", getQualityColor(stats.accuracy))}>
                                {stats.accuracy ? `±${stats.accuracy.toFixed(1)}m` : '--'}
                            </div>
                        </div>
                    </div>

                    {/* Guidance Text */}
                    <div className="text-xs text-text-muted bg-panel-soft/50 p-3 rounded-xl border border-border/50">
                        {!isQualitySufficient ? (
                            <span className="flex items-center justify-center gap-2 text-warning font-medium">
                                <AlertTriangle size={14} />
                                {stats.samples < 10 ? "Collecting satellite data..." : "Improving accuracy..."}
                            </span>
                        ) : (
                            <span className="flex items-center justify-center gap-2 text-success font-bold">
                                <CheckCircle size={14} />
                                Signal Lock Acquired.
                            </span>
                        )}
                    </div>

                    {/* Actions */}
                    <button
                        onClick={handleAccept}
                        disabled={stats.samples === 0}
                        className={clsx(
                            "w-full py-4 rounded-xl font-bold transition-all shadow-lg active:scale-[0.98]",
                            stats.samples > 0
                                ? "bg-primary text-white hover:bg-primary/90 shadow-primary/20"
                                : "bg-panel-soft text-text-muted cursor-not-allowed border border-border"
                        )}
                    >
                        {stats.samples > 0 && !isQualitySufficient ? "Force Accept (Low Accuracy)" : "Confirm Coordinates"}
                    </button>
                </div>
            </div>
        </div>
    );
};