import React from 'react';
import { Camera, ShieldCheck } from 'lucide-react';
import { ImageInput } from '../../../../../../components/ui/ImageInput';
import type { StepProps } from '../types';

interface ExtendedPhotosStepProps extends StepProps {
    treeId: string;
    hasBarkPhoto?: boolean;
    setHasBarkPhoto?: (has: boolean) => void; // Legacy
    hasLeafPhoto?: boolean;
    setHasLeafPhoto?: (has: boolean) => void; // Legacy
}

export const PhotosStep: React.FC<ExtendedPhotosStepProps> = ({
    treeId,
    onNext
}) => {
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
            <div className="flex items-center justify-between px-1 border-b border-border/50 pb-2">
                <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest flex items-center gap-2">
                    <Camera size={14} className="text-primary" />
                    Evidence Array
                </h3>
                <div className="flex items-center gap-1.5 text-[9px] font-mono font-bold bg-primary/10 text-primary px-2 py-1 rounded border border-primary/20">
                    <ShieldCheck size={10} />
                    AUTO-LINKED
                </div>
            </div>

            {/* The Grid */}
            <div className="grid grid-cols-2 gap-4">
                <ImageInput
                    parentId={treeId}
                    type="FULL"
                    label="Full Profile"
                />
                <ImageInput
                    parentId={treeId}
                    type="BARK"
                    label="Bark Texture"
                />
                <ImageInput
                    parentId={treeId}
                    type="LEAF"
                    label="Leaf / Canopy"
                />
                <ImageInput
                    parentId={treeId}
                    type="FRUIT"
                    label="Reproductive"
                />
            </div>

            <div className="p-4 rounded-2xl bg-panel-soft/50 border border-border flex gap-3 items-start">
                <div className="p-2 rounded-lg bg-panel border border-border text-text-muted">
                    <Camera size={16} />
                </div>
                <div className="space-y-1">
                    <div className="text-xs font-bold text-text-main">Local Encryption Active</div>
                    <p className="text-[10px] text-text-muted leading-relaxed">
                        Media is stored in the secure IndexedDB blob store. Sync occurs automatically when connection is restored.
                    </p>
                </div>
            </div>

            {/* Floating Action Button for Next */}
            <div className="flex justify-end pt-4">
                <button
                    onClick={() => onNext?.()}
                    className="px-8 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 active:scale-95"
                >
                    Confirm Evidence
                </button>
            </div>
        </div>
    );
};