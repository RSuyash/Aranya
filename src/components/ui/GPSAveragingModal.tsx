import React, { useEffect, useState } from 'react';
import { X, MapPin, Crosshair, CheckCircle, AlertTriangle } from 'lucide-react';
import { gpsManager } from '../../utils/gps/GPSManager';

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
        gpsManager.startAveraging();

        const unsubscribe = gpsManager.subscribe((state) => {
            if (state.currentResult) {
                setStats(state.currentResult);
            }
        });

        return () => {
            unsubscribe();
            gpsManager.stopGPS();
        };
    }, []);

    const handleAccept = () => {
        if (stats.samples > 0) {
            gpsManager.stopGPS();
            onSave(stats);
        }
    };

    // Determine quality color
    const getQualityColor = (acc: number) => {
        if (acc === 0) return 'text-gray-500';
        if (acc < 2) return 'text-[#52d273]'; // Excellent
        if (acc < 5) return 'text-[#56ccf2]'; // Good
        return 'text-[#f2c94c]'; // Moderate/Poor
    };

    // Ecological Quality Gate
    const isQualitySufficient = stats.samples >= 10 && stats.accuracy <= 5;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-[#0b1020] border border-[#1d2440] rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="px-6 py-4 border-b border-[#1d2440] flex justify-between items-center bg-[#050814]">
                    <h3 className="font-bold text-[#f5f7ff] flex items-center gap-2">
                        <Crosshair className="w-5 h-5 text-[#56ccf2]" />
                        Precision GPS
                    </h3>
                    <button onClick={onClose} className="text-[#9ba2c0] hover:text-white"><X size={20} /></button>
                </div>

                <div className="p-6 text-center space-y-6">
                    {/* Visualizer */}
                    <div className="relative w-32 h-32 mx-auto flex items-center justify-center">
                        {/* Ripple Effect */}
                        <div className="absolute inset-0 bg-[#56ccf2]/10 rounded-full animate-ping" />
                        <div className="absolute inset-4 bg-[#56ccf2]/20 rounded-full animate-pulse" />

                        <div className="relative z-10 bg-[#0b1020] border-2 border-[#56ccf2] w-16 h-16 rounded-full flex items-center justify-center">
                            <MapPin className="w-8 h-8 text-[#56ccf2]" />
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-[#11182b] p-3 rounded-xl border border-[#1d2440]">
                            <div className="text-[10px] text-[#9ba2c0] uppercase tracking-wider">Samples</div>
                            <div className="text-2xl font-mono font-bold text-[#f5f7ff]">
                                {stats.samples}
                            </div>
                        </div>
                        <div className="bg-[#11182b] p-3 rounded-xl border border-[#1d2440]">
                            <div className="text-[10px] text-[#9ba2c0] uppercase tracking-wider">Precision (SE)</div>
                            <div className={`text-2xl font-mono font-bold ${getQualityColor(stats.accuracy)}`}>
                                {stats.accuracy ? `±${stats.accuracy.toFixed(1)}m` : '--'}
                            </div>
                        </div>
                    </div>

                    {/* Guidance Text */}
                    <div className="text-xs text-[#9ba2c0] bg-[#11182b] p-3 rounded-lg">
                        {!isQualitySufficient ? (
                            <span className="flex items-center justify-center gap-2 text-[#f2c94c]">
                                <AlertTriangle size={14} />
                                {stats.samples < 10 ? "Collecting samples..." : "Improving accuracy..."}
                            </span>
                        ) : (
                            <span className="flex items-center justify-center gap-2 text-[#52d273]">
                                <CheckCircle size={14} />
                                High precision achieved.
                            </span>
                        )}
                    </div>

                    {/* Actions */}
                    <button
                        onClick={handleAccept}
                        disabled={!isQualitySufficient && stats.samples < 20} // Allow override after 20 samples if desperate
                        className={`w-full py-3 rounded-xl font-semibold transition ${isQualitySufficient || stats.samples >= 20
                                ? 'bg-[#56ccf2] text-[#050814] hover:bg-[#4ab8de]'
                                : 'bg-[#1d2440] text-[#555b75] cursor-not-allowed'
                            }`}
                    >
                        Accept Coordinate
                    </button>

                    {stats.samples >= 20 && !isQualitySufficient && (
                        <p className="text-[10px] text-[#f2c94c] mt-2">
                            Signal weak. You can force accept, but accuracy is low.
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};
