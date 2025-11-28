import React, { useState } from 'react';
import { X, ChevronRight, Save } from 'lucide-react';
import { clsx } from 'clsx';
import { db } from '../../../core/data-model/dexie';
import { v4 as uuidv4 } from 'uuid';
import type { VegetationObservation } from '../../../core/data-model/types';
import { VegetationIdStep } from './components/VegetationIdStep';
import type { GrowthForm } from './components/VegetationIdStep';
import { VegetationMetricsStep } from './components/VegetationMetricsStep';
import { VegetationPhotosStep } from './components/VegetationPhotosStep';
import { VegetationReviewStep } from './components/VegetationReviewStep';

interface VegetationEntryFormProps {
    projectId: string;
    moduleId: string;
    plotId: string;
    unitId: string;
    unitLabel: string;
    initialPosition?: { x: number, y: number };
    onClose: () => void;
    onSaveSuccess: () => void;
}

type Step = 'ID' | 'METRICS' | 'PHOTOS' | 'REVIEW';

export const VegetationEntryForm: React.FC<VegetationEntryFormProps> = ({
    projectId,
    moduleId,
    plotId,
    unitId,
    unitLabel,
    initialPosition,
    onClose,
    onSaveSuccess
}) => {
    const [currentStep, setCurrentStep] = useState<Step>('ID');

    // Form State
    const [speciesName, setSpeciesName] = useState('');
    const [isUnknown, setIsUnknown] = useState(false);
    const [growthForm, setGrowthForm] = useState<GrowthForm | null>(null);
    const [abundanceCount, setAbundanceCount] = useState('');
    const [coverPercentage, setCoverPercentage] = useState('');
    const [avgHeight, setAvgHeight] = useState('');
    const [hasGroundPhoto, setHasGroundPhoto] = useState(false);
    const [hasCloseupPhoto, setHasCloseupPhoto] = useState(false);

    const handleSave = async (addAnother: boolean) => {
        const now = Date.now();

        const newVeg: VegetationObservation = {
            id: uuidv4(),
            projectId,
            moduleId,
            plotId,
            samplingUnitId: unitId,
            speciesName: isUnknown ? 'Unknown' : speciesName,
            growthForm: growthForm!,
            isUnknown,
            confidenceLevel: isUnknown ? 'LOW' : 'HIGH',
            abundanceCount: abundanceCount ? parseInt(abundanceCount) : undefined,
            coverPercentage: coverPercentage ? parseFloat(coverPercentage) : undefined,
            avgHeightCm: avgHeight ? parseFloat(avgHeight) : undefined,
            localX: initialPosition?.x,
            localY: initialPosition?.y,
            images: [], // Placeholder for now
            validationStatus: 'PENDING',
            createdAt: now,
            updatedAt: now
        };

        await db.vegetationObservations.add(newVeg);

        // Update Unit Status
        const existingProgress = await db.samplingUnits
            .where({ plotId, samplingUnitId: unitId })
            .first();

        if (!existingProgress) {
            await db.samplingUnits.add({
                id: uuidv4(),
                projectId,
                moduleId,
                plotId,
                samplingUnitId: unitId,
                status: 'IN_PROGRESS',
                createdAt: now,
                lastUpdatedAt: now
            });
        } else if (existingProgress.status === 'NOT_STARTED') {
            await db.samplingUnits.update(existingProgress.id, {
                status: 'IN_PROGRESS',
                lastUpdatedAt: now
            });
        }

        if (addAnother) {
            // Reset for next entry
            setSpeciesName('');
            setGrowthForm(null);
            setAbundanceCount('');
            setCoverPercentage('');
            setAvgHeight('');
            setHasGroundPhoto(false);
            setHasCloseupPhoto(false);
            setCurrentStep('ID');
            onSaveSuccess();
        } else {
            onSaveSuccess();
            onClose();
        }
    };

    const renderStepIndicator = () => (
        <div className="flex items-center justify-center gap-2 mb-6">
            {(['ID', 'METRICS', 'PHOTOS', 'REVIEW'] as Step[]).map((step, idx) => (
                <div key={step} className="flex items-center">
                    <div className={clsx(
                        "w-2.5 h-2.5 rounded-full transition-all",
                        currentStep === step ? "bg-primary scale-125" :
                            idx < (['ID', 'METRICS', 'PHOTOS', 'REVIEW'].indexOf(currentStep)) ? "bg-success" : "bg-border"
                    )} />
                    {idx < 3 && <div className="w-4 h-0.5 bg-border mx-1" />}
                </div>
            ))}
        </div>
    );

    return (
        <div className="fixed inset-0 z-50 bg-app flex flex-col animate-in slide-in-from-bottom duration-300">
            {/* Header */}
            <div className="px-4 py-4 border-b border-border flex items-center justify-between bg-panel">
                <div className="flex items-center gap-3">
                    <button onClick={onClose} className="text-text-muted hover:text-text-main">
                        <X className="w-6 h-6" />
                    </button>
                    <div>
                        <h2 className="text-lg font-bold text-text-main">New Vegetation</h2>
                        <div className="flex items-center gap-2 text-xs text-text-muted">
                            <span className="bg-panel-soft px-1.5 py-0.5 rounded text-primary font-medium">{unitLabel}</span>
                            <span>•</span>
                            {initialPosition ? (
                                <span className="font-mono text-success">
                                    X:{initialPosition.x.toFixed(1)} Y:{initialPosition.y.toFixed(1)}
                                </span>
                            ) : (
                                <span>Manual Entry</span>
                            )}
                        </div>
                    </div>
                </div>
                {growthForm && (
                    <div className="text-xs font-mono text-primary bg-primary/10 px-2 py-1 rounded border border-primary/20">
                        {growthForm}
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
                {renderStepIndicator()}

                <div className="max-w-md mx-auto space-y-6">
                    {currentStep === 'ID' && (
                        <VegetationIdStep
                            growthForm={growthForm}
                            setGrowthForm={setGrowthForm}
                            speciesName={speciesName}
                            setSpeciesName={setSpeciesName}
                            isUnknown={isUnknown}
                            setIsUnknown={setIsUnknown}
                        />
                    )}

                    {currentStep === 'METRICS' && (
                        <VegetationMetricsStep
                            abundanceCount={abundanceCount}
                            setAbundanceCount={setAbundanceCount}
                            coverPercentage={coverPercentage}
                            setCoverPercentage={setCoverPercentage}
                            avgHeight={avgHeight}
                            setAvgHeight={setAvgHeight}
                        />
                    )}

                    {currentStep === 'PHOTOS' && (
                        <VegetationPhotosStep
                            hasGroundPhoto={hasGroundPhoto}
                            setHasGroundPhoto={setHasGroundPhoto}
                            hasCloseupPhoto={hasCloseupPhoto}
                            setHasCloseupPhoto={setHasCloseupPhoto}
                        />
                    )}

                    {currentStep === 'REVIEW' && (
                        <VegetationReviewStep
                            growthForm={growthForm}
                            speciesName={speciesName}
                            isUnknown={isUnknown}
                            abundanceCount={abundanceCount}
                            coverPercentage={coverPercentage}
                            avgHeight={avgHeight}
                            hasGroundPhoto={hasGroundPhoto}
                            hasCloseupPhoto={hasCloseupPhoto}
                        />
                    )}
                </div>
            </div>

            {/* Footer Actions */}
            <div className="p-4 border-t border-border bg-panel flex gap-3">
                {currentStep === 'ID' ? (
                    <>
                        <button
                            onClick={onClose}
                            className="px-4 py-3 rounded-xl border border-border text-text-muted font-medium hover:bg-panel-soft transition"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => {
                                if (!growthForm || (!speciesName && !isUnknown)) return;
                                setCurrentStep('METRICS');
                            }}
                            disabled={!growthForm || (!speciesName && !isUnknown)}
                            className="flex-1 bg-primary text-app font-bold py-3 rounded-xl hover:bg-primary/90 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Next Step <ChevronRight className="w-5 h-5" />
                        </button>
                    </>
                ) : currentStep !== 'REVIEW' ? (
                    <>
                        <button
                            onClick={() => {
                                if (currentStep === 'METRICS') setCurrentStep('ID');
                                if (currentStep === 'PHOTOS') setCurrentStep('METRICS');
                            }}
                            className="px-4 py-3 rounded-xl border border-border text-text-muted font-medium hover:bg-panel-soft transition"
                        >
                            Back
                        </button>
                        <button
                            onClick={() => {
                                if (currentStep === 'METRICS') {
                                    setCurrentStep('PHOTOS');
                                } else if (currentStep === 'PHOTOS') {
                                    setCurrentStep('REVIEW');
                                }
                            }}
                            className="flex-1 bg-primary text-app font-bold py-3 rounded-xl hover:bg-primary/90 transition flex items-center justify-center gap-2"
                        >
                            Next Step <ChevronRight className="w-5 h-5" />
                        </button>
                    </>
                ) : (
                    <>
                        <button
                            onClick={() => setCurrentStep('PHOTOS')}
                            className="px-4 py-3 rounded-xl border border-border text-text-muted font-medium hover:bg-panel-soft transition"
                        >
                            Back
                        </button>
                        <div className="flex-1 flex gap-3">
                            <button
                                onClick={() => handleSave(true)}
                                className="flex-1 bg-panel-soft border border-primary text-primary font-bold py-3 rounded-xl hover:bg-panel transition"
                            >
                                Save & Add Another
                            </button>
                            <button
                                onClick={() => handleSave(false)}
                                className="flex-1 bg-success text-app font-bold py-3 rounded-xl hover:bg-success/90 transition flex items-center justify-center gap-2"
                            >
                                <Save className="w-5 h-5" />
                                Finish
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};
