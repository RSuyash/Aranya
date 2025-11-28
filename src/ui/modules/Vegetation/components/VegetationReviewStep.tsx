import React from 'react';
import type { GrowthForm } from './VegetationIdStep';

interface VegetationReviewStepProps {
    growthForm: GrowthForm | null;
    speciesName: string;
    isUnknown: boolean;
    abundanceCount: string;
    coverPercentage: string;
    avgHeight: string;
    hasGroundPhoto: boolean;
    hasCloseupPhoto: boolean;
}

export const VegetationReviewStep: React.FC<VegetationReviewStepProps> = ({
    growthForm,
    speciesName,
    isUnknown,
    abundanceCount,
    coverPercentage,
    avgHeight,
    hasGroundPhoto,
    hasCloseupPhoto
}) => {
    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="bg-panel-soft border border-border rounded-xl p-4 space-y-3">
                <div className="flex justify-between border-b border-border pb-2">
                    <span className="text-text-muted">Growth Form</span>
                    <span className="font-medium text-text-main">{growthForm}</span>
                </div>
                <div className="flex justify-between border-b border-border pb-2">
                    <span className="text-text-muted">Species</span>
                    <span className="font-medium text-text-main">{isUnknown ? 'Unknown' : speciesName}</span>
                </div>
                {abundanceCount && (
                    <div className="flex justify-between border-b border-border pb-2">
                        <span className="text-text-muted">Count</span>
                        <span className="font-mono text-text-main">{abundanceCount}</span>
                    </div>
                )}
                {coverPercentage && (
                    <div className="flex justify-between border-b border-border pb-2">
                        <span className="text-text-muted">Cover</span>
                        <span className="font-mono text-text-main">{coverPercentage}%</span>
                    </div>
                )}
                {avgHeight && (
                    <div className="flex justify-between border-b border-border pb-2">
                        <span className="text-text-muted">Height</span>
                        <span className="font-mono text-text-main">{avgHeight} cm</span>
                    </div>
                )}
                <div className="flex justify-between">
                    <span className="text-text-muted">Photos</span>
                    <span className="text-text-main">{[hasGroundPhoto, hasCloseupPhoto].filter(Boolean).length} added</span>
                </div>
            </div>
        </div>
    );
};
