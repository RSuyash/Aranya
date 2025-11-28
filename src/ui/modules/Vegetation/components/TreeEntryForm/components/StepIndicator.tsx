import React from 'react';
import { clsx } from 'clsx';
import type { Step } from '../types';

interface StepIndicatorProps {
    currentStep: Step;
}

export const StepIndicator: React.FC<StepIndicatorProps> = ({ currentStep }) => {
    const steps: Step[] = ['ID', 'METRICS', 'PHOTOS', 'REVIEW'];

    return (
        <div className="flex items-center justify-center gap-2 mb-6">
            {steps.map((step, idx) => (
                <div key={step} className="flex items-center">
                    <div className={clsx(
                        "w-2.5 h-2.5 rounded-full transition-all",
                        currentStep === step ? "bg-primary scale-125" :
                            idx < steps.indexOf(currentStep) ? "bg-success" : "bg-border"
                    )} />
                    {idx < 3 && <div className="w-4 h-0.5 bg-border mx-1" />}
                </div>
            ))}
        </div>
    );
};
