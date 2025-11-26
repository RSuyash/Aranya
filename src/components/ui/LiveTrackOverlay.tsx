import React, { useEffect, useState } from 'react';
import { gpsManager } from '../../utils/gps/GPSManager';
import { Play, StopCircle, Navigation } from 'lucide-react';

export const LiveTrackOverlay: React.FC<{ projectId: string; surveyorId: string; moduleId: string }> = ({
    projectId, surveyorId, moduleId
}) => {
    const [points, setPoints] = useState<Array<{ lat: number, lng: number }>>([]);
    const [isTracking, setIsTracking] = useState(false);

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
        return () => { unsubscribe(); };
    }, []);

    // Toggle Tracking
    const toggleTracking = () => {
        if (isTracking) {
            gpsManager.stopGPS();
        } else {
            // High Frequency Mode for Testing: 1 meter or 1 second
            gpsManager.startTracking(projectId, surveyorId, moduleId, { minDistance: 1, minTime: 1000 });
        }
    };

    // SVG Projection Logic
    const getPathData = () => {
        if (points.length < 2) return '';

        // 1. Find Bounding Box
        let minLat = Infinity, maxLat = -Infinity, minLng = Infinity, maxLng = -Infinity;
        points.forEach(p => {
            if (p.lat < minLat) minLat = p.lat;
            if (p.lat > maxLat) maxLat = p.lat;
            if (p.lng < minLng) minLng = p.lng;
            if (p.lng > maxLng) maxLng = p.lng;
        });

        // Add padding
        const latRange = maxLat - minLat || 0.0001;
        const lngRange = maxLng - minLng || 0.0001;

        // 2. Project to 300x200 SVG
        const width = 300;
        const height = 200;

        return points.map((p, i) => {
            // Normalize 0-1
            const xNorm = (p.lng - minLng) / lngRange;
            const yNorm = (maxLat - p.lat) / latRange; // Flip Y for SVG

            const x = xNorm * width;
            const y = yNorm * height;

            return `${i === 0 ? 'M' : 'L'} ${x},${y}`;
        }).join(' ');
    };

    return (
        <div className="bg-[#0b1020] border border-[#1d2440] rounded-xl overflow-hidden">
            {/* Header / Controls */}
            <div className="p-4 border-b border-[#1d2440] flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${isTracking ? 'bg-[#52d273] animate-pulse' : 'bg-[#9ba2c0]'}`} />
                    <span className="font-semibold text-[#f5f7ff]">
                        {isTracking ? 'Tracking Active' : 'Tracking Paused'}
                    </span>
                </div>
                <button
                    onClick={toggleTracking}
                    className={`p-2 rounded-lg transition ${isTracking ? 'bg-[#ff7e67]/20 text-[#ff7e67]' : 'bg-[#56ccf2]/20 text-[#56ccf2]'}`}
                >
                    {isTracking ? <StopCircle size={20} /> : <Play size={20} />}
                </button>
            </div>

            {/* Mini Map Visualization */}
            <div className="relative h-48 bg-[#050814] w-full">
                {points.length > 0 ? (
                    <svg className="w-full h-full p-4" viewBox="0 0 300 200" preserveAspectRatio="xMidYMid meet">
                        {/* Track Path */}
                        <path
                            d={getPathData()}
                            fill="none"
                            stroke="#56ccf2"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                        {/* Start Point */}
                        {getPathData() && (
                            <>
                                <circle cx={getPathData().split(' ')[1]?.split(',')[0]} cy={getPathData().split(' ')[1]?.split(',')[1]} r="3" fill="#52d273" />
                                {/* Current Position (End) */}
                                <circle cx={getPathData().split(' ').pop()?.split(',')[0]} cy={getPathData().split(' ').pop()?.split(',')[1]} r="4" fill="#ff7e67" className="animate-pulse" />
                            </>
                        )}
                    </svg>
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-[#555b75] text-xs">
                        <Navigation className="w-6 h-6 mb-2 opacity-50" />
                        No track data yet
                    </div>
                )}

                {/* Stats Overlay */}
                {isTracking && (
                    <div className="absolute bottom-2 left-2 right-2 flex gap-2">
                        <div className="bg-[#0b1020]/80 backdrop-blur px-3 py-1 rounded-md text-[10px] text-[#9ba2c0] border border-[#1d2440]">
                            Points: <span className="text-[#f5f7ff]">{points.length}</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
