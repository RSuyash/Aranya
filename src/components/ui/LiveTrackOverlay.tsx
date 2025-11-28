import React, { useEffect, useState } from 'react';
import { gpsManager } from '../../utils/gps/GPSManager';
import { Play, Square, Footprints } from 'lucide-react';
import { clsx } from 'clsx';

export const LiveTrackOverlay: React.FC<{ projectId: string; surveyorId: string; moduleId: string }> = ({
    projectId, surveyorId, moduleId
}) => {
    const [points, setPoints] = useState<Array<{ lat: number, lng: number }>>([]);
    const [isTracking, setIsTracking] = useState(false);
    const [duration, setDuration] = useState(0);

    useEffect(() => {
        const unsubscribe = gpsManager.subscribe((state) => {
            setIsTracking(state.mode === 'TRACKING');
            if (state.mode === 'TRACKING') {
                const currentState = gpsManager.getCurrentState();
                // @ts-ignore
                if (currentState.trackPoints) {
                    // @ts-ignore
                    setPoints(currentState.trackPoints.map(p => ({ lat: p.lat, lng: p.lng })));
                }
            }
        });

        let timer: any;
        if (isTracking) {
            timer = setInterval(() => setDuration(d => d + 1), 1000);
        } else {
            setDuration(0);
        }

        return () => {
            unsubscribe();
            clearInterval(timer);
        };
    }, [isTracking]);

    const toggleTracking = () => {
        if (isTracking) {
            if (confirm("Finish current patrol track?")) {
                gpsManager.stopGPS();
            }
        } else {
            gpsManager.startTracking(projectId, surveyorId, moduleId, { minDistance: 2, minTime: 5000 });
        }
    };

    const formatTime = (sec: number) => {
        const m = Math.floor(sec / 60);
        const s = sec % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    return (
        // UPDATED: Semantic background and text for Light Mode
        <div className="bg-panel border border-border rounded-2xl overflow-hidden shadow-sm transition-colors duration-300">
            <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className={clsx(
                        "w-12 h-12 rounded-xl flex items-center justify-center transition-colors",
                        isTracking ? "bg-success/10 text-success" : "bg-panel-soft text-text-muted"
                    )}>
                        <Footprints className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="font-bold text-text-main text-lg">
                            {isTracking ? "Patrol Active" : "Survey Patrol"}
                        </h3>
                        <div className="text-xs text-text-muted flex items-center gap-2">
                            {isTracking ? (
                                <>
                                    <span className="text-success font-mono font-bold">{formatTime(duration)}</span>
                                    <span>•</span>
                                    <span>{points.length} points logged</span>
                                </>
                            ) : (
                                "Record your path between plots"
                            )}
                        </div>
                    </div>
                </div>

                <button
                    onClick={toggleTracking}
                    className={clsx(
                        "flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition shadow-md",
                        isTracking
                            ? "bg-danger text-white hover:bg-danger/90 shadow-danger/20"
                            : "bg-panel-soft text-text-main border border-border hover:bg-primary hover:text-white hover:border-primary shadow-sm"
                    )}
                >
                    {isTracking ? (
                        <>
                            <Square className="w-4 h-4 fill-current" /> Stop
                        </>
                    ) : (
                        <>
                            <Play className="w-4 h-4 fill-current" /> Start Track
                        </>
                    )}
                </button>
            </div>

            {/* Progress Line */}
            {isTracking && (
                <div className="h-1 w-full bg-panel-soft overflow-hidden">
                    <div className="h-full bg-success w-full animate-progress-indeterminate origin-left" />
                </div>
            )}
        </div>
    );
};