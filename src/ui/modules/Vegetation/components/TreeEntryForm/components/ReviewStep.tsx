import React from 'react';
import { Save } from 'lucide-react';
import type { StepProps } from '../types';

interface ReviewStepProps extends StepProps {
    tagNumber: string;
    speciesName: string;
    isUnknown: boolean;
    morphospeciesCode: string;
    stems: Array<{ id: string; gbh: string }>;
    equivalentGBH: number;
    hasBarkPhoto: boolean;
    hasLeafPhoto: boolean;
    validationWarnings: string[];
    onSave: (addAnother: boolean) => void;
}

export const ReviewStep: React.FC<ReviewStepProps> = ({
    tagNumber,
    speciesName,
    isUnknown,
    morphospeciesCode,
    stems,
    equivalentGBH,
    hasBarkPhoto,
    hasLeafPhoto,
    validationWarnings,
    onBack,
    onSave
}) => {
    const hasBiometricWarnings = validationWarnings.length > 0;

    return (
        <div className="flex flex-col h-full">
            <div className="flex-1 space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="bg-panel-soft border border-border rounded-xl p-4 space-y-3">
                    <div className="flex justify-between border-b border-border pb-2">
                        <span className="text-text-muted">Tag</span>
                        <span className="font-mono font-bold text-text-main">{tagNumber}</span>
                    </div>
                    <div className="flex justify-between border-b border-border pb-2">
                        <span className="text-text-muted">Species</span>
                        <span className="font-medium text-text-main">
                            {isUnknown
                                ? `${morphospeciesCode || 'Unknown Specimen'}`
                                : speciesName}
                        </span>
                    </div>

                    {/* Stem Details */}
                    {stems.filter(s => s.gbh).length > 1 ? (
                        <>
                            <div className="border-b border-border pb-2">
                                <span className="text-text-muted block mb-2">Stems ({stems.filter(s => s.gbh).length})</span>
                                <div className="space-y-1">
                                    {stems.filter(s => s.gbh).map((stem, idx) => (
                                        <div key={stem.id} className="text-sm font-mono text-text-main flex justify-between">
                                            <span className="text-text-muted">Stem {idx + 1}</span>
                                            <span>{stem.gbh} cm</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="flex justify-between border-b border-border pb-2">
                                <span className="text-text-muted">Equivalent GBH</span>
                                <span className="font-mono font-bold text-primary">{equivalentGBH.toFixed(2)} cm</span>
                            </div>
                        </>
                    ) : (
                        <div className="flex justify-between border-b border-border pb-2">
                            <span className="text-text-muted">GBH</span>
                            <span className="font-mono text-text-main">{equivalentGBH.toFixed(2)} cm</span>
                        </div>
                    )}

                    <div className="flex justify-between">
                        <span className="text-text-muted">Photos</span>
                        <span className="text-text-main">{[hasBarkPhoto, hasLeafPhoto].filter(Boolean).length} added</span>
                    </div>

                    {/* Validation Warnings Display */}
                    {hasBiometricWarnings && (
                        <div className="mt-4 p-3 bg-warning/10 border border-warning/50 rounded-xl">
                            <div className="flex items-start gap-2">
                                <span className="text-warning mt-0.5">⚠️</span>
                                <div>
                                    <div className="text-xs font-bold text-warning uppercase mb-1">Validation Warnings</div>
                                    <ul className="text-sm text-text-main space-y-1">
                                        {validationWarnings.map((warning, idx) => (
                                            <li key={idx} className="flex items-start">
                                                <span className="text-warning mr-2">•</span>
                                                {warning}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Footer Actions */}
            <div className="mt-auto pt-4 flex gap-3">
                <button
                    onClick={onBack}
                    className="px-4 py-3 rounded-xl border border-border text-text-muted font-medium hover:bg-panel-soft transition"
                >
                    Back
                </button>
                <div className="flex-1 flex gap-3">
                    <button
                        onClick={() => onSave(true)}
                        className={`flex-1 ${hasBiometricWarnings ? 'bg-warning text-app' : 'bg-panel-soft border border-primary text-primary'} font-bold py-3 rounded-xl hover:${hasBiometricWarnings ? 'bg-warning/90' : 'bg-border'} transition`}
                    >
                        {hasBiometricWarnings ? 'Save Flagged & Add Another' : 'Save & Add Another'}
                    </button>
                    <button
                        onClick={() => onSave(false)}
                        className={`flex-1 ${hasBiometricWarnings ? 'bg-warning text-app' : 'bg-success text-app'} font-bold py-3 rounded-xl hover:${hasBiometricWarnings ? 'bg-warning/90' : 'bg-success/90'} transition flex items-center justify-center gap-2`}
                    >
                        <Save className="w-5 h-5" />
                        {hasBiometricWarnings ? 'Confirm & Finish' : 'Finish'}
                    </button>
                </div>
            </div>
        </div>
    );
};
