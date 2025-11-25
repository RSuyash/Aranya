import React, { useState, useEffect } from 'react';
import { X, ChevronRight, ChevronLeft, Save, Camera, Leaf, Ruler, Info } from 'lucide-react';
import { clsx } from 'clsx';
import { db } from '../../../core/data-model/dexie';
import { v4 as uuidv4 } from 'uuid';
import type { TreeObservation } from '../../../core/data-model/types';

interface TreeEntryFormProps {
    projectId: string;
    moduleId: string;
    plotId: string;
    unitId: string;
    unitLabel: string;
    onClose: () => void;
    onSaveSuccess: () => void;
}

type Step = 'ID' | 'METRICS' | 'PHOTOS' | 'REVIEW';

export const TreeEntryForm: React.FC<TreeEntryFormProps> = ({
    projectId,
    moduleId,
    plotId,
    unitId,
    unitLabel,
    onClose,
    onSaveSuccess
}) => {
    const [currentStep, setCurrentStep] = useState<Step>('ID');

    // Form State
    const [tagNumber, setTagNumber] = useState('');
    const [speciesName, setSpeciesName] = useState('');
    const [isUnknown, setIsUnknown] = useState(false);
    const [gbh, setGbh] = useState('');
    const [height, setHeight] = useState('');
    const [hasBarkPhoto, setHasBarkPhoto] = useState(false);
    const [hasLeafPhoto, setHasLeafPhoto] = useState(false);

    // Auto-suggest next tag number
    useEffect(() => {
        const fetchLastTag = async () => {
            const lastTree = await db.treeObservations
                .where('plotId')
                .equals(plotId)
                .reverse()
                .sortBy('createdAt');

            if (lastTree && lastTree.length > 0) {
                const lastTag = parseInt(lastTree[0].tagNumber);
                if (!isNaN(lastTag)) {
                    setTagNumber((lastTag + 1).toString());
                }
            }
        };
        fetchLastTag();
    }, [plotId]);

    const handleSave = async (addAnother: boolean) => {
        const now = Date.now();
        const newTree: TreeObservation = {
            id: uuidv4(),
            projectId,
            moduleId,
            plotId,
            samplingUnitId: unitId,
            tagNumber,
            speciesName: isUnknown ? 'Unknown' : speciesName,
            isUnknown,
            confidenceLevel: isUnknown ? 'LOW' : 'HIGH',
            gbh: parseFloat(gbh),
            height: height ? parseFloat(height) : undefined,
            stemCount: 1,
            condition: 'ALIVE',
            phenology: 'VEGETATIVE',
            images: [], // Placeholder for now
            validationStatus: 'PENDING',
            createdAt: now,
            updatedAt: now
        };

        await db.treeObservations.add(newTree);

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
            // Reset for next tree
            setTagNumber((prev) => (parseInt(prev) + 1).toString());
            setSpeciesName('');
            setGbh('');
            setHeight('');
            setHasBarkPhoto(false);
            setHasLeafPhoto(false);
            setCurrentStep('ID');
            onSaveSuccess(); // Trigger any parent refreshes if needed, but keep form open
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
                        currentStep === step ? "bg-[#56ccf2] scale-125" :
                            idx < (['ID', 'METRICS', 'PHOTOS', 'REVIEW'].indexOf(currentStep)) ? "bg-[#52d273]" : "bg-[#1d2440]"
                    )} />
                    {idx < 3 && <div className="w-4 h-0.5 bg-[#1d2440] mx-1" />}
                </div>
            ))}
        </div>
    );

    return (
        <div className="fixed inset-0 z-50 bg-[#050814] flex flex-col animate-in slide-in-from-bottom duration-300">
            {/* Header */}
            <div className="px-4 py-4 border-b border-[#1d2440] flex items-center justify-between bg-[#0b1020]">
                <div className="flex items-center gap-3">
                    <button onClick={onClose} className="text-[#9ba2c0] hover:text-[#f5f7ff]">
                        <X className="w-6 h-6" />
                    </button>
                    <div>
                        <h2 className="text-lg font-bold text-[#f5f7ff]">New Tree</h2>
                        <p className="text-xs text-[#9ba2c0]">{unitLabel} • Plot {plotId.slice(0, 4)}...</p>
                    </div>
                </div>
                <div className="text-xs font-mono text-[#56ccf2] bg-[#071824] px-2 py-1 rounded border border-[#15324b]">
                    TAG: {tagNumber || '...'}
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
                {renderStepIndicator()}

                <div className="max-w-md mx-auto space-y-6">
                    {currentStep === 'ID' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div>
                                <label className="block text-xs font-medium text-[#9ba2c0] uppercase mb-2">Tag Number</label>
                                <input
                                    type="number"
                                    value={tagNumber}
                                    onChange={e => setTagNumber(e.target.value)}
                                    className="w-full bg-[#11182b] border border-[#1d2440] rounded-xl px-4 py-3 text-2xl font-mono text-[#f5f7ff] focus:border-[#56ccf2] outline-none"
                                    placeholder="101"
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-[#9ba2c0] uppercase mb-2">Species</label>
                                <input
                                    type="text"
                                    value={speciesName}
                                    onChange={e => setSpeciesName(e.target.value)}
                                    disabled={isUnknown}
                                    className="w-full bg-[#11182b] border border-[#1d2440] rounded-xl px-4 py-3 text-lg text-[#f5f7ff] focus:border-[#56ccf2] outline-none disabled:opacity-50"
                                    placeholder="Search species..."
                                />
                                <div className="mt-3 flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="unknown-species"
                                        checked={isUnknown}
                                        onChange={e => setIsUnknown(e.target.checked)}
                                        className="w-4 h-4 rounded border-[#1d2440] bg-[#11182b] text-[#56ccf2]"
                                    />
                                    <label htmlFor="unknown-species" className="text-sm text-[#9ba2c0]">Unknown Species</label>
                                </div>
                            </div>
                        </div>
                    )}

                    {currentStep === 'METRICS' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div>
                                <label className="block text-xs font-medium text-[#9ba2c0] uppercase mb-2">GBH (cm)</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        value={gbh}
                                        onChange={e => setGbh(e.target.value)}
                                        className="w-full bg-[#11182b] border border-[#1d2440] rounded-xl px-4 py-3 text-2xl font-mono text-[#f5f7ff] focus:border-[#56ccf2] outline-none pl-12"
                                        placeholder="0"
                                        autoFocus
                                    />
                                    <Ruler className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#56ccf2]" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-[#9ba2c0] uppercase mb-2">Height (m) <span className="text-[#555b75] lowercase">(optional)</span></label>
                                <input
                                    type="number"
                                    value={height}
                                    onChange={e => setHeight(e.target.value)}
                                    className="w-full bg-[#11182b] border border-[#1d2440] rounded-xl px-4 py-3 text-lg font-mono text-[#f5f7ff] focus:border-[#56ccf2] outline-none"
                                    placeholder="0.0"
                                />
                            </div>
                        </div>
                    )}

                    {currentStep === 'PHOTOS' && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                            <button
                                onClick={() => setHasBarkPhoto(!hasBarkPhoto)}
                                className={clsx(
                                    "w-full p-6 rounded-xl border-2 border-dashed flex flex-col items-center gap-3 transition",
                                    hasBarkPhoto ? "border-[#52d273] bg-[#0b2214]/30" : "border-[#1d2440] bg-[#11182b] hover:border-[#56ccf2]"
                                )}
                            >
                                <Camera className={clsx("w-8 h-8", hasBarkPhoto ? "text-[#52d273]" : "text-[#9ba2c0]")} />
                                <span className={clsx("font-medium", hasBarkPhoto ? "text-[#52d273]" : "text-[#9ba2c0]")}>
                                    {hasBarkPhoto ? "Bark Photo Added" : "Take Bark Photo"}
                                </span>
                            </button>

                            <button
                                onClick={() => setHasLeafPhoto(!hasLeafPhoto)}
                                className={clsx(
                                    "w-full p-6 rounded-xl border-2 border-dashed flex flex-col items-center gap-3 transition",
                                    hasLeafPhoto ? "border-[#52d273] bg-[#0b2214]/30" : "border-[#1d2440] bg-[#11182b] hover:border-[#56ccf2]"
                                )}
                            >
                                <Leaf className={clsx("w-8 h-8", hasLeafPhoto ? "text-[#52d273]" : "text-[#9ba2c0]")} />
                                <span className={clsx("font-medium", hasLeafPhoto ? "text-[#52d273]" : "text-[#9ba2c0]")}>
                                    {hasLeafPhoto ? "Leaf Photo Added" : "Take Leaf Photo"}
                                </span>
                            </button>
                        </div>
                    )}

                    {currentStep === 'REVIEW' && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="bg-[#11182b] border border-[#1d2440] rounded-xl p-4 space-y-3">
                                <div className="flex justify-between border-b border-[#1d2440] pb-2">
                                    <span className="text-[#9ba2c0]">Tag</span>
                                    <span className="font-mono font-bold text-[#f5f7ff]">{tagNumber}</span>
                                </div>
                                <div className="flex justify-between border-b border-[#1d2440] pb-2">
                                    <span className="text-[#9ba2c0]">Species</span>
                                    <span className="font-medium text-[#f5f7ff]">{isUnknown ? 'Unknown' : speciesName}</span>
                                </div>
                                <div className="flex justify-between border-b border-[#1d2440] pb-2">
                                    <span className="text-[#9ba2c0]">GBH</span>
                                    <span className="font-mono text-[#f5f7ff]">{gbh} cm</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-[#9ba2c0]">Photos</span>
                                    <span className="text-[#f5f7ff]">{[hasBarkPhoto, hasLeafPhoto].filter(Boolean).length} added</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Footer Actions */}
            <div className="p-4 border-t border-[#1d2440] bg-[#0b1020] flex gap-3">
                {currentStep !== 'ID' && (
                    <button
                        onClick={() => {
                            if (currentStep === 'METRICS') setCurrentStep('ID');
                            if (currentStep === 'PHOTOS') setCurrentStep('METRICS');
                            if (currentStep === 'REVIEW') setCurrentStep('PHOTOS');
                        }}
                        className="px-4 py-3 rounded-xl border border-[#1d2440] text-[#9ba2c0] font-medium hover:bg-[#11182b] transition"
                    >
                        Back
                    </button>
                )}

                {currentStep !== 'REVIEW' ? (
                    <button
                        onClick={() => {
                            if (currentStep === 'ID') {
                                if (!tagNumber || (!speciesName && !isUnknown)) return;
                                setCurrentStep('METRICS');
                            } else if (currentStep === 'METRICS') {
                                if (!gbh) return;
                                setCurrentStep('PHOTOS');
                            } else if (currentStep === 'PHOTOS') {
                                setCurrentStep('REVIEW');
                            }
                        }}
                        className="flex-1 bg-[#56ccf2] text-[#050814] font-bold py-3 rounded-xl hover:bg-[#4ab8de] transition flex items-center justify-center gap-2"
                    >
                        Next Step <ChevronRight className="w-5 h-5" />
                    </button>
                ) : (
                    <div className="flex-1 flex gap-3">
                        <button
                            onClick={() => handleSave(true)}
                            className="flex-1 bg-[#11182b] border border-[#56ccf2] text-[#56ccf2] font-bold py-3 rounded-xl hover:bg-[#1d2440] transition"
                        >
                            Save & Add Another
                        </button>
                        <button
                            onClick={() => handleSave(false)}
                            className="flex-1 bg-[#52d273] text-[#050814] font-bold py-3 rounded-xl hover:bg-[#45c165] transition flex items-center justify-center gap-2"
                        >
                            <Save className="w-5 h-5" />
                            Finish
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
