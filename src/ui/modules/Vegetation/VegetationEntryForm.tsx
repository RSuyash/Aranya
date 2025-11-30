import React, { useState } from 'react';
import { X, ChevronRight, Save, Leaf, Ruler, Camera, FileCheck } from 'lucide-react';
import { clsx } from 'clsx';
import { db } from '../../../core/data-model/dexie';
import { v4 as uuidv4 } from 'uuid';
import type { VegetationObservation } from '../../../core/data-model/types';
import { VegetationIdStep } from './components/VegetationIdStep';
import type { GrowthForm } from './components/VegetationIdStep';
import { VegetationMetricsStep } from './components/VegetationMetricsStep';
import { VegetationPhotosStep } from './components/VegetationPhotosStep';
import { VegetationReviewStep } from './components/VegetationReviewStep';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

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
        try {
            await Haptics.impact({ style: ImpactStyle.Heavy });
        } catch (e) { /* Ignore */ }

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
            images: [],
            validationStatus: 'PENDING',
            createdAt: now,
            updatedAt: now
        };

        await db.vegetationObservations.add(newVeg);

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

    // --- OPTICAL COMPONENT: THE PROGRESS RAIL ---
    const renderStepIndicator = () => {
        const steps = [
            { id: 'ID', icon: Leaf },
            { id: 'METRICS', icon: Ruler },
            { id: 'PHOTOS', icon: Camera },
            { id: 'REVIEW', icon: FileCheck },
        ];

        const currentIdx = steps.findIndex(s => s.id === currentStep);

        return (
            <div className="flex items-center justify-between relative px-4 mb-8">
                {/* The Rail */}
                <div className="absolute left-4 right-4 top-1/2 -translate-y-1/2 h-1 bg-border rounded-full z-0 overflow-hidden">
                    <div
                        className="h-full bg-primary transition-all duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)]"
                        style={{ width: `${(currentIdx / (steps.length - 1)) * 100}%` }}
                    />
                </div>

                {/* The Nodes */}
                {steps.map((step, idx) => {
                    const isActive = idx === currentIdx;
                    const isCompleted = idx < currentIdx;
                    const Icon = step.icon;

                    return (
                        <div
                            key={step.id}
                            className={clsx(
                                "relative z-10 w-10 h-10 rounded-xl flex items-center justify-center border-2 transition-all duration-300 shadow-sm",
                                isActive
                                    ? "bg-panel border-primary text-primary scale-110 shadow-[0_0_15px_rgba(var(--primary),0.3)]"
                                    : isCompleted
                                        ? "bg-primary border-primary text-app"
                                        : "bg-panel border-border text-text-muted"
                            )}
                        >
                            <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        // SURFACE: High-grade Glassmorphism
        <div className="fixed inset-0 z-[100] bg-app/95 backdrop-blur-3xl flex flex-col animate-in slide-in-from-bottom duration-300">

            {/* Header */}
            <div className="px-6 py-5 border-b border-border flex items-center justify-between bg-panel/50">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onClose}
                        className="w-10 h-10 rounded-full bg-panel border border-border flex items-center justify-center text-text-muted hover:text-text-main hover:border-primary transition-all active:scale-95"
                    >
                        <X size={20} />
                    </button>
                    <div>
                        <h2 className="text-xl font-black text-text-main tracking-tight leading-none">New Flora</h2>
                        <div className="flex items-center gap-2 text-xs font-mono text-text-muted mt-1">
                            <span className="text-primary font-bold uppercase tracking-wider">{unitLabel}</span>
                            <span className="opacity-30">|</span>
                            {initialPosition ? (
                                <span>
                                    VECTOR: {initialPosition.x.toFixed(1)}, {initialPosition.y.toFixed(1)}
                                </span>
                            ) : (
                                <span>MANUAL INPUT</span>
                            )}
                        </div>
                    </div>
                </div>

                {growthForm && (
                    <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-panel border border-border">
                        <Leaf size={14} className="text-success" />
                        <span className="text-xs font-bold text-text-main">{growthForm}</span>
                    </div>
                )}
            </div>

            {/* Scrollable Workspace */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                <div className="max-w-lg mx-auto py-8 px-6">
                    {renderStepIndicator()}

                    <div className="min-h-[400px]">
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
            </div>

            {/* Command Bar */}
            <div className="p-6 border-t border-border bg-panel flex gap-4 safe-area-pb">
                {currentStep === 'ID' ? (
                    <button
                        onClick={() => {
                            if (!growthForm || (!speciesName && !isUnknown)) return;
                            setCurrentStep('METRICS');
                        }}
                        disabled={!growthForm || (!speciesName && !isUnknown)}
                        className={clsx(
                            "w-full h-14 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all shadow-lg active:scale-[0.98]",
                            (!growthForm || (!speciesName && !isUnknown))
                                ? "bg-panel-soft border border-border text-text-muted cursor-not-allowed opacity-50"
                                : "bg-primary text-app hover:bg-primary/90 shadow-primary/20"
                        )}
                    >
                        Confirm Identity <ChevronRight size={24} />
                    </button>
                ) : currentStep !== 'REVIEW' ? (
                    <div className="flex w-full gap-4">
                        <button
                            onClick={() => {
                                if (currentStep === 'METRICS') setCurrentStep('ID');
                                if (currentStep === 'PHOTOS') setCurrentStep('METRICS');
                            }}
                            className="w-20 h-14 rounded-xl border border-border bg-panel-soft text-text-muted hover:text-text-main flex items-center justify-center hover:bg-panel transition-all active:scale-95"
                        >
                            Back
                        </button>
                        <button
                            onClick={() => {
                                if (currentStep === 'METRICS') setCurrentStep('PHOTOS');
                                if (currentStep === 'PHOTOS') setCurrentStep('REVIEW');
                            }}
                            className="flex-1 h-14 rounded-xl bg-primary text-app font-bold text-lg flex items-center justify-center gap-3 hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 active:scale-[0.98]"
                        >
                            Next Step <ChevronRight size={24} />
                        </button>
                    </div>
                ) : (
                    <div className="flex w-full gap-4">
                        <button
                            onClick={() => setCurrentStep('PHOTOS')}
                            className="w-20 h-14 rounded-xl border border-border bg-panel-soft text-text-muted hover:text-text-main flex items-center justify-center hover:bg-panel transition-all active:scale-95"
                        >
                            Back
                        </button>
                        <button
                            onClick={() => handleSave(true)}
                            className="flex-1 h-14 rounded-xl border-2 border-primary text-primary font-bold text-sm uppercase tracking-wide hover:bg-primary/5 transition-all active:scale-[0.98]"
                        >
                            Save & Add More
                        </button>
                        <button
                            onClick={() => handleSave(false)}
                            className="flex-[1.5] h-14 rounded-xl bg-success text-app font-bold text-lg flex items-center justify-center gap-3 hover:bg-success/90 transition-all shadow-lg shadow-success/20 active:scale-[0.98]"
                        >
                            <Save size={24} />
                            Finish
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};