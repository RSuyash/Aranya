import React from 'react';
import { AlertTriangle, CheckCircle2, Fingerprint } from 'lucide-react';
import { clsx } from 'clsx';
import type { ReviewStepProps } from '../types';

const DataRow = ({ label, value, subValue, highlight, isWarning }: any) => (
    <div className="flex justify-between items-start py-4 border-b border-white/10 last:border-0 relative z-10">
        <span className="text-xs font-bold text-text-muted uppercase tracking-wider mt-1">{label}</span>
        <div className="text-right">
            <div className={clsx(
                "font-bold text-base",
                isWarning ? "text-warning" : highlight ? "text-primary" : "text-text-main"
            )}>
                {value}
            </div>
            {subValue && <div className="text-[11px] text-text-muted mt-0.5 opacity-80">{subValue}</div>}
        </div>
    </div>
);

export const ReviewStep: React.FC<ReviewStepProps> = ({
    tagNumber, speciesName, isUnknown, morphospeciesCode, stems,
    equivalentGBH, hasBarkPhoto, hasLeafPhoto, validationWarnings = [], height,
    onNext: _onNext
}) => {
    const hasBiometricWarnings = validationWarnings.length > 0;
    const photoCount = [hasBarkPhoto, hasLeafPhoto].filter(Boolean).length;

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">

            {/* 1. STATUS BANNER */}
            {hasBiometricWarnings ? (
                <div className="bg-warning/10 border border-warning/30 rounded-2xl p-5 flex gap-4 items-start shadow-sm animate-pulse">
                    <div className="p-2 bg-warning/20 rounded-xl h-fit text-warning shrink-0">
                        <AlertTriangle size={24} />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-warning uppercase tracking-wide mb-1">Flagged for Review</h4>
                        <ul className="text-xs text-text-main space-y-1.5 list-disc pl-4 opacity-90 leading-relaxed font-medium">
                            {validationWarnings.map((w, i) => <li key={i}>{w}</li>)}
                        </ul>
                    </div>
                </div>
            ) : (
                <div className="bg-success/10 border border-success/30 rounded-2xl p-5 flex items-center gap-4 shadow-sm">
                    <div className="p-2 bg-success/20 rounded-xl text-success shrink-0">
                        <CheckCircle2 size={24} />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-success uppercase tracking-wide">Valid Entry</h4>
                        <p className="text-xs text-text-main mt-0.5">Biometric data within expected ranges.</p>
                    </div>
                </div>
            )}

            {/* 2. DATA SUMMARY CARD */}
            <div className="bg-panel-soft border border-border rounded-3xl p-6 shadow-xl relative overflow-hidden ring-1 ring-border">
                {/* Decoration */}
                <Fingerprint className="absolute -bottom-10 -right-10 text-text-muted opacity-[0.02] w-64 h-64 pointer-events-none z-0" />

                <DataRow label="Tree Tag" value={tagNumber} highlight />
                <DataRow
                    label="Identity"
                    value={isUnknown ? morphospeciesCode || 'Unknown' : speciesName}
                    subValue={isUnknown ? 'Morphospecies Code' : 'Scientific Name'}
                />
                <DataRow
                    label="Structure"
                    value={`${equivalentGBH.toFixed(1)} cm GBH`}
                    subValue={`${stems.length} Stem${stems.length !== 1 ? 's' : ''} • Height: ${height ? height + 'm' : '--'}`}
                />
                <DataRow
                    label="Evidence"
                    value={`${photoCount} Photos`}
                    subValue={photoCount === 0 ? 'No photos attached' : 'Ready for sync'}
                />
            </div>
        </div>
    );
};