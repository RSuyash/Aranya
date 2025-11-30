import React, { useEffect, useState } from 'react';
import { Camera, Trash2, Loader2, Scan } from 'lucide-react';
import { clsx } from 'clsx';
import { cameraService } from '../../core/media/CameraService';
import { db } from '../../core/data-model/dexie';
import { useLiveQuery } from 'dexie-react-hooks';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

interface ImageInputProps {
    parentId: string; // The Tree ID
    type: string;     // 'BARK', 'LEAF', etc.
    label: string;
    onCapture?: () => void;
}

export const ImageInput: React.FC<ImageInputProps> = ({ parentId, type, label, onCapture }) => {
    const [isCapturing, setIsCapturing] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    // Live Query: Automatically updates UI when media is added/removed
    const mediaItem = useLiveQuery(
        () => db.media.where({ parentId, type }).first(),
        [parentId, type]
    );

    // Effect: Hydrate Blob to URL for <img> tag
    useEffect(() => {
        let url: string | null = null;
        if (mediaItem) {
            url = URL.createObjectURL(mediaItem.blob);
            setPreviewUrl(url);
        } else {
            setPreviewUrl(null);
        }
        return () => {
            if (url) URL.revokeObjectURL(url);
        };
    }, [mediaItem]);

    const handleCapture = async () => {
        Haptics.impact({ style: ImpactStyle.Medium });
        setIsCapturing(true);
        try {
            if (mediaItem) {
                await cameraService.deleteMedia(mediaItem.id);
            }
            await cameraService.captureAndSave(parentId, type);
            if (onCapture) onCapture();
            Haptics.notification({ type: 'success' as any });
        } catch (e) {
            console.error(e);
            Haptics.notification({ type: 'error' as any });
        } finally {
            setIsCapturing(false);
        }
    };

    const handleDelete = async (e: React.MouseEvent) => {
        e.stopPropagation();
        Haptics.impact({ style: ImpactStyle.Light });
        if (mediaItem) {
            await cameraService.deleteMedia(mediaItem.id);
        }
    };

    return (
        <button
            onClick={handleCapture}
            disabled={isCapturing}
            className={clsx(
                "relative aspect-[4/3] w-full rounded-2xl transition-all duration-300 group overflow-hidden flex flex-col items-center justify-center isolate",
                mediaItem
                    ? "bg-black border border-border shadow-lg"
                    : "bg-panel-soft/30 border border-border/50 hover:bg-panel-soft hover:border-primary/50"
            )}
        >
            {/* --- STATE 1: LOADING (Scanning) --- */}
            {isCapturing && (
                <div className="absolute inset-0 z-30 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center">
                    <div className="relative">
                        <Scan className="w-12 h-12 text-primary animate-pulse" strokeWidth={1} />
                        <Loader2 className="absolute inset-0 w-12 h-12 text-primary animate-spin opacity-50" />
                    </div>
                    <span className="mt-3 text-[10px] font-mono text-primary uppercase tracking-widest animate-pulse">
                        Processing Sensor Data...
                    </span>
                </div>
            )}

            {/* --- STATE 2: EMPTY (Viewfinder) --- */}
            {!mediaItem && !isCapturing && (
                <>
                    {/* Corner Brackets (Viewfinder Aesthetic) */}
                    <div className="absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 border-text-muted/30 rounded-tl-sm group-hover:border-primary/50 transition-colors" />
                    <div className="absolute top-3 right-3 w-4 h-4 border-t-2 border-r-2 border-text-muted/30 rounded-tr-sm group-hover:border-primary/50 transition-colors" />
                    <div className="absolute bottom-3 left-3 w-4 h-4 border-b-2 border-l-2 border-text-muted/30 rounded-bl-sm group-hover:border-primary/50 transition-colors" />
                    <div className="absolute bottom-3 right-3 w-4 h-4 border-b-2 border-r-2 border-text-muted/30 rounded-br-sm group-hover:border-primary/50 transition-colors" />

                    <div className="p-4 rounded-full bg-panel border border-border group-hover:scale-110 group-hover:border-primary/30 group-hover:text-primary transition-all duration-500 shadow-sm z-10">
                        <Camera className="w-6 h-6 text-text-muted group-hover:text-primary transition-colors" />
                    </div>

                    <div className="mt-3 flex flex-col items-center gap-1 z-10">
                        <span className="text-xs font-bold uppercase tracking-widest text-text-muted group-hover:text-text-main transition-colors">
                            {label}
                        </span>
                        <span className="text-[9px] font-mono text-text-muted/50 group-hover:text-primary/70">
                            NO SIGNAL
                        </span>
                    </div>

                    {/* Grid Pattern (Subtle) */}
                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
                        style={{ backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)', backgroundSize: '16px 16px' }}
                    />
                </>
            )}

            {/* --- STATE 3: FILLED (Preview) --- */}
            {mediaItem && previewUrl && (
                <>
                    <img
                        src={previewUrl}
                        alt={label}
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-90 group-hover:opacity-100"
                    />

                    {/* Meta Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-4">
                        <div className="flex justify-end">
                            <div className="bg-black/50 backdrop-blur-md px-2 py-1 rounded text-[9px] font-mono text-white/70 border border-white/10">
                                {(mediaItem.blob.size / 1024).toFixed(0)} KB
                            </div>
                        </div>

                        <div className="flex justify-between items-end">
                            <div>
                                <div className="text-[10px] font-bold uppercase tracking-widest text-primary mb-0.5">
                                    {label}
                                </div>
                                <div className="text-[9px] font-mono text-white/50">
                                    {new Date(mediaItem.timestamp).toLocaleTimeString()}
                                </div>
                            </div>

                            <div
                                onClick={handleDelete}
                                className="p-2 rounded-xl bg-red-500/20 border border-red-500/30 text-red-200 hover:bg-red-500 hover:text-white transition-colors backdrop-blur-md cursor-pointer"
                            >
                                <Trash2 size={16} />
                            </div>
                        </div>
                    </div>

                    {/* Status LED (Always visible) */}
                    <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/40 backdrop-blur-sm px-2 py-1 rounded-full border border-white/10">
                        <div className="w-1.5 h-1.5 bg-success rounded-full shadow-[0_0_8px_var(--success)] animate-pulse" />
                        <span className="text-[9px] font-bold text-white/80">REC</span>
                    </div>
                </>
            )}
        </button>
    );
};