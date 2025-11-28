import React from 'react';
import { Camera } from 'lucide-react';
import { clsx } from 'clsx';

interface VegetationPhotosStepProps {
    hasGroundPhoto: boolean;
    setHasGroundPhoto: (val: boolean) => void;
    hasCloseupPhoto: boolean;
    setHasCloseupPhoto: (val: boolean) => void;
}

export const VegetationPhotosStep: React.FC<VegetationPhotosStepProps> = ({
    hasGroundPhoto,
    setHasGroundPhoto,
    hasCloseupPhoto,
    setHasCloseupPhoto
}) => {
    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <button
                onClick={() => setHasGroundPhoto(!hasGroundPhoto)}
                className={clsx(
                    "w-full p-6 rounded-xl border-2 border-dashed flex flex-col items-center gap-3 transition",
                    hasGroundPhoto ? "border-success bg-success/10" : "border-border bg-panel-soft hover:border-primary"
                )}
            >
                <Camera className={clsx("w-8 h-8", hasGroundPhoto ? "text-success" : "text-text-muted")} />
                <span className={clsx("font-medium", hasGroundPhoto ? "text-success" : "text-text-muted")}>
                    {hasGroundPhoto ? "Ground Photo Added" : "Take Ground Photo"}
                </span>
            </button>

            <button
                onClick={() => setHasCloseupPhoto(!hasCloseupPhoto)}
                className={clsx(
                    "w-full p-6 rounded-xl border-2 border-dashed flex flex-col items-center gap-3 transition",
                    hasCloseupPhoto ? "border-success bg-success/10" : "border-border bg-panel-soft hover:border-primary"
                )}
            >
                <Camera className={clsx("w-8 h-8", hasCloseupPhoto ? "text-success" : "text-text-muted")} />
                <span className={clsx("font-medium", hasCloseupPhoto ? "text-success" : "text-text-muted")}>
                    {hasCloseupPhoto ? "Close-up Photo Added" : "Take Close-up Photo"}
                </span>
            </button>
        </div>
    );
};
