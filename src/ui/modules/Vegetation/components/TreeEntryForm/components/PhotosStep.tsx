import React from 'react';
import { Camera, Image as ImageIcon, CheckCircle2 } from 'lucide-react';
import { clsx } from 'clsx';
import type { PhotosStepProps } from '../types';

const EvidenceCard = ({
    label, active, onClick, icon: Icon
}: { label: string, active: boolean, onClick: () => void, icon: any }) => (
    <button
        onClick={onClick}
        className={clsx(
            "relative aspect-square rounded-3xl border-2 flex flex-col items-center justify-center gap-3 transition-all duration-300 group overflow-hidden shadow-sm",
            active
                ? "bg-success/5 border-success shadow-[0_0_20px_-5px_rgba(34,197,94,0.3)]"
                : "bg-panel border-border hover:border-primary/50 hover:bg-panel-soft"
        )}
    >
        {active && (
            <div className="absolute top-3 right-3 text-success animate-in zoom-in bg-success/10 rounded-full p-1">
                <CheckCircle2 size={16} strokeWidth={4} />
            </div>
        )}

        <div className={clsx(
            "p-4 rounded-2xl transition-all duration-300 ring-1 ring-inset",
            active
                ? "bg-success text-white ring-transparent scale-110"
                : "bg-panel-soft text-text-muted ring-border group-hover:bg-primary group-hover:text-white group-hover:ring-primary"
        )}>
            <Icon size={28} strokeWidth={1.5} />
        </div>

        <span className={clsx(
            "text-xs font-bold uppercase tracking-widest transition-colors",
            active ? "text-success" : "text-text-muted group-hover:text-text-main"
        )}>
            {label}
        </span>
    </button>
);

export const PhotosStep: React.FC<PhotosStepProps> = ({
    hasBarkPhoto, setHasBarkPhoto,
    hasLeafPhoto, setHasLeafPhoto,
    onNext: _onNext
}) => {
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
            <div className="flex items-center justify-between px-1">
                <h3 className="text-sm font-bold text-text-muted uppercase tracking-widest flex items-center gap-2">
                    <Camera size={16} className="text-primary" />
                    Evidence Collection
                </h3>
                <span className="text-[10px] font-mono font-bold bg-panel-soft px-2 py-1 rounded text-text-muted border border-border">
                    OPTIONAL
                </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <EvidenceCard
                    label="Bark"
                    active={hasBarkPhoto}
                    onClick={() => setHasBarkPhoto(!hasBarkPhoto)}
                    icon={ImageIcon}
                />
                <EvidenceCard
                    label="Canopy"
                    active={hasLeafPhoto}
                    onClick={() => setHasLeafPhoto(!hasLeafPhoto)}
                    icon={ImageIcon}
                />
            </div>

            <div className="p-4 rounded-2xl bg-panel-soft border border-border text-center">
                <p className="text-xs text-text-muted leading-relaxed">
                    Photos are automatically geotagged with current plot coordinates.
                </p>
            </div>
        </div>
    );
};