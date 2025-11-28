import React from 'react';
import { clsx } from 'clsx';
import type { Step } from '../types';

interface StepIndicatorProps {
    currentStep: Step;
}

export const StepIndicator: React.FC<StepIndicatorProps> = ({ currentStep }) => {
    const steps: { id: Step; label: string }[] = [
        { id: 'ID', label: 'Identity' },
        { id: 'METRICS', label: 'Metrics' },
        { id: 'PHOTOS', label: 'Evidence' },
        { id: 'REVIEW', label: 'Confirm' },
    ];

    const currentIdx = steps.findIndex(s => s.id === currentStep);

    return (
        <div className="w-full px-4 py-3">
            <div className="flex justify-between items-center mb-2">
                {steps.map((step, idx) => {
                    const isActive = idx === currentIdx;
                    const isCompleted = idx < currentIdx;
                    return (
                        <div key={step.id} className={clsx(
                            "text-[10px] font-bold uppercase tracking-widest transition-colors duration-300",
                            isActive ? "text-primary" : isCompleted ? "text-success" : "text-text-muted/40"
                        )}>
                            {step.label}
                        </div>
                    );
                })}
            </div>

            {/* Unified Track */}
            <div className="h-1.5 w-full bg-black/20 rounded-full overflow-hidden relative">
                {/* Background Indicators */}
                <div className="absolute inset-0 flex">
                    {steps.map((_, i) => (
                        <div key={i} className="flex-1 border-r border-app/50 last:border-0" />
                    ))}
                </div>

                {/* Active Bar */}
                <div
                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-success to-primary transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]"
                    style={{ width: `${((currentIdx + 1) / steps.length) * 100}%` }}
                />
            </div>
        </div>
    );
};