import React from 'react';
import { Camera, Leaf, ChevronRight } from 'lucide-react';
import { clsx } from 'clsx';
import type { StepProps } from '../types';

interface PhotosStepProps extends StepProps {
    hasBarkPhoto: boolean;
    setHasBarkPhoto: (val: boolean) => void;
    hasLeafPhoto: boolean;
    setHasLeafPhoto: (val: boolean) => void;
}

export const PhotosStep: React.FC<PhotosStepProps> = ({
    hasBarkPhoto,
    setHasBarkPhoto,
    hasLeafPhoto,
    setHasLeafPhoto,
    onNext,
    onBack
}) => {
    return (
        <div className="flex flex-col h-full">
            <div className="flex-1 space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                <button
                    onClick={() => setHasBarkPhoto(!hasBarkPhoto)}
                    className={clsx(
                        "w-full p-6 rounded-xl border-2 border-dashed flex flex-col items-center gap-3 transition",
                        hasBarkPhoto ? "border-success bg-success/10" : "border-border bg-panel-soft hover:border-primary"
                    )}
                >
                    <Camera className={clsx("w-8 h-8", hasBarkPhoto ? "text-success" : "text-text-muted")} />
                    <span className={clsx("font-medium", hasBarkPhoto ? "text-success" : "text-text-muted")}>
                        {hasBarkPhoto ? "Bark Photo Added" : "Take Bark Photo"}
                    </span>
                </button>

                <button
                    onClick={() => setHasLeafPhoto(!hasLeafPhoto)}
                    className={clsx(
                        "w-full p-6 rounded-xl border-2 border-dashed flex flex-col items-center gap-3 transition",
                        hasLeafPhoto ? "border-success bg-success/10" : "border-border bg-panel-soft hover:border-primary"
                    )}
                >
                    <Leaf className={clsx("w-8 h-8", hasLeafPhoto ? "text-success" : "text-text-muted")} />
                    <span className={clsx("font-medium", hasLeafPhoto ? "text-success" : "text-text-muted")}>
                        {hasLeafPhoto ? "Leaf Photo Added" : "Take Leaf Photo"}
                    </span>
                </button>
            </div>

            {/* Footer Actions */}
            <div className="mt-auto pt-4 flex gap-3">
                <button
                    onClick={onBack}
                    className="px-4 py-3 rounded-xl border border-border text-text-muted font-medium hover:bg-panel-soft transition"
                >
                    Back
                </button>
                <button
                    onClick={onNext}
                    className="flex-1 bg-primary text-app font-bold py-3 rounded-xl hover:bg-primary/90 transition flex items-center justify-center gap-2"
                >
                    Next Step <ChevronRight className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
};
