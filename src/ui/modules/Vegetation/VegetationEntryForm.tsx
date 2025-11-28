import React, { useState } from 'react';
import { X, ChevronRight, Save, Camera, Sprout, TreeDeciduous, Leaf, Wheat, Flower } from 'lucide-react';
import { clsx } from 'clsx';
import { db } from '../../../core/data-model/dexie';
import { v4 as uuidv4 } from 'uuid';
import type { VegetationObservation } from '../../../core/data-model/types';

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
type GrowthForm = 'HERB' | 'SHRUB' | 'CLIMBER' | 'GRASS' | 'FERN';

const GROWTH_FORMS: Array<{ value: GrowthForm; label: string; icon: React.ReactNode; color: string }> = [
    { value: 'HERB', label: 'Herb', icon: <Sprout className="w-6 h-6" />, color: '#52d273' },
    { value: 'SHRUB', label: 'Shrub', icon: <TreeDeciduous className="w-6 h-6" />, color: '#56ccf2' },
    { value: 'CLIMBER', label: 'Climber', icon: <Leaf className="w-6 h-6" />, color: '#9b87f5' },
    { value: 'GRASS', label: 'Grass', icon: <Wheat className="w-6 h-6" />, color: '#f4d03f' },
    { value: 'FERN', label: 'Fern', icon: <Flower className="w-6 h-6" />, color: '#6cb2eb' },
];

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
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            {/* Growth Form Selection */}
                            <div>
                                <label className="block text-xs font-medium text-text-muted uppercase mb-3">Growth Form *</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {GROWTH_FORMS.map(form => (
                                        <button
                                            key={form.value}
                                            onClick={() => setGrowthForm(form.value)}
                                            className={clsx(
                                                "p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition",
                                                growthForm === form.value
                                                    ? "border-primary bg-primary/10"
                                                    : "border-border bg-panel-soft hover:border-primary"
                                            )}
                                        >
                                            <div style={{ color: growthForm === form.value ? form.color : 'var(--text-muted)' }}>
                                                {form.icon}
                                            </div>
                                            <span className={clsx(
                                                "text-sm font-medium",
                                                growthForm === form.value ? "text-text-main" : "text-text-muted"
                                            )}>
                                                {form.label}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Species Name */}
                            <div>
                                <label className="block text-xs font-medium text-text-muted uppercase mb-2">Species</label>
                                <input
                                    type="text"
                                    value={speciesName}
                                    onChange={e => setSpeciesName(e.target.value)}
                                    disabled={isUnknown}
                                    className="w-full bg-panel-soft border border-border rounded-xl px-4 py-3 text-lg text-text-main focus:border-primary outline-none disabled:opacity-50"
                                    placeholder="Search species..."
                                />
                                <div className="mt-3 flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="unknown-species"
                                        checked={isUnknown}
                                        onChange={e => setIsUnknown(e.target.checked)}
                                        className="w-4 h-4 rounded border-border bg-panel-soft text-primary"
                                    />
                                    <label htmlFor="unknown-species" className="text-sm text-text-muted">Unknown Species</label>
                                </div>
                            </div>
                        </div>
                    )}

                    {currentStep === 'METRICS' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div>
                                <label className="block text-xs font-medium text-text-muted uppercase mb-2">
                                    Individual Count <span className="text-text-muted/70 lowercase">(optional)</span>
                                </label>
                                <input
                                    type="number"
                                    value={abundanceCount}
                                    onChange={e => setAbundanceCount(e.target.value)}
                                    className="w-full bg-panel-soft border border-border rounded-xl px-4 py-3 text-2xl font-mono text-text-main focus:border-primary outline-none"
                                    placeholder="0"
                                    autoFocus
                                    min="0"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-text-muted uppercase mb-2">
                                    Ground Cover (%) <span className="text-text-muted/70 lowercase">(optional)</span>
                                </label>
                                <input
                                    type="number"
                                    value={coverPercentage}
                                    onChange={e => {
                                        const val = parseFloat(e.target.value);
                                        if (e.target.value === '' || (val >= 0 && val <= 100)) {
                                            setCoverPercentage(e.target.value);
                                        }
                                    }}
                                    className="w-full bg-panel-soft border border-border rounded-xl px-4 py-3 text-2xl font-mono text-text-main focus:border-primary outline-none"
                                    placeholder="0"
                                    min="0"
                                    max="100"
                                    step="0.1"
                                />
                                {coverPercentage && parseFloat(coverPercentage) > 100 && (
                                    <p className="mt-2 text-xs text-danger">Cover percentage must be between 0-100</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-text-muted uppercase mb-2">
                                    Avg Height (cm) <span className="text-text-muted/70 lowercase">(optional)</span>
                                </label>
                                <input
                                    type="number"
                                    value={avgHeight}
                                    onChange={e => setAvgHeight(e.target.value)}
                                    className="w-full bg-panel-soft border border-border rounded-xl px-4 py-3 text-lg font-mono text-text-main focus:border-primary outline-none"
                                    placeholder="0.0"
                                    min="0"
                                    step="0.1"
                                />
                            </div>
                        </div>
                    )}

                    {currentStep === 'PHOTOS' && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                            <button
                                onClick={() => setHasGroundPhoto(!hasGroundPhoto)}
                                className={clsx(
                                    "w-full p-6 rounded-xl border-2 border-dashed flex flex-col items-center gap-3 transition",
                                    hasGroundPhoto ? "border-success bg-success/10" : "border-border bg-panel-soft hover:border-primary"
                                )}
                            >
                                <Camera className={clsx("w-8 h-8", hasGroundPhoto ? "text-success" : "text-text-muted")} />
                                <span className={clsx("font-medium", hasGroundPhoto ? "text-success" : "text-text-muted")}>
                                    {hasGroundPhoto ? "Ground Photo Added" : "Take Ground Photo"}
                                </span>
                            </button>

                            <button
                                onClick={() => setHasCloseupPhoto(!hasCloseupPhoto)}
                                className={clsx(
                                    "w-full p-6 rounded-xl border-2 border-dashed flex flex-col items-center gap-3 transition",
                                    hasCloseupPhoto ? "border-success bg-success/10" : "border-border bg-panel-soft hover:border-primary"
                                )}
                            >
                                <Camera className={clsx("w-8 h-8", hasCloseupPhoto ? "text-success" : "text-text-muted")} />
                                <span className={clsx("font-medium", hasCloseupPhoto ? "text-success" : "text-text-muted")}>
                                    {hasCloseupPhoto ? "Close-up Photo Added" : "Take Close-up Photo"}
                                </span>
                            </button>
                        </div>
                    )}

                    {currentStep === 'REVIEW' && (
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
