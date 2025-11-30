import React, { useState, useEffect, useMemo } from 'react';
import {
    X, Target, ChevronRight, ArrowLeft,
    Save, CopyPlus
} from 'lucide-react';
import { gpsManager } from '../../../../../utils/gps/GPSManager';
import { db } from '../../../../../core/data-model/dexie';
import { v4 as uuidv4 } from 'uuid';
import type { TreeObservation, VegetationModule } from '../../../../../core/data-model/types';
import { useLiveQuery } from 'dexie-react-hooks';
import type { TreeEntryFormProps, Step } from './types';
import { IdStep } from './components/IdStep';
import { MetricsStep } from './components/MetricsStep';
import { PhotosStep } from './components/PhotosStep';
import { ReviewStep } from './components/ReviewStep';
import { clsx } from 'clsx';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

export const TreeEntryForm: React.FC<TreeEntryFormProps> = ({
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

    // [THORNE] Stable Tree ID for Media Linking
    // We generate this ONCE on mount so we can attach photos before hitting "Save"
    const [treeId, setTreeId] = useState<string>(() => uuidv4());

    // --- Form State ---
    const [tagNumber, setTagNumber] = useState('');
    const [speciesName, setSpeciesName] = useState('');
    const [speciesSearch, setSpeciesSearch] = useState('');
    const [selectedSpeciesId, setSelectedSpeciesId] = useState<string | null>(null);
    const [isUnknown, setIsUnknown] = useState(false);
    const [morphospeciesCode, setMorphospeciesCode] = useState('');
    const [stems, setStems] = useState<Array<{ id: string; gbh: string }>>([
        { id: uuidv4(), gbh: '' }
    ]);
    const [height, setHeight] = useState('');

    // [THORNE] Deprecated boolean states for photos - now handled by DB queries in ImageInput
    // Keeping placeholders if needed for legacy prop compatibility, but functionality is moved.
    const hasBarkPhoto = false;
    const hasLeafPhoto = false;

    // --- GPS Stats ---
    const [gpsStats, setGpsStats] = useState<{ samples: number, acc: number | null }>({ samples: 0, acc: null });

    useEffect(() => {
        gpsManager.startMeasuring();
        const unsubscribe = gpsManager.subscribe((state) => {
            if (state.mode === 'MEASURING' && state.currentResult) {
                setGpsStats({
                    samples: state.currentResult.samples,
                    acc: state.currentResult.accuracy
                });
            }
        });
        return () => {
            unsubscribe();
            gpsManager.stopMeasuring();
        };
    }, []);

    const moduleData = useLiveQuery(() => db.modules.get(moduleId)) as VegetationModule | undefined;

    // --- Smart Logic ---
    const heightThreshold = moduleData?.validationSettings?.maxExpectedHeightM || 70;
    const gbhThreshold = moduleData?.validationSettings?.maxExpectedGbhCm || 500;

    const filteredSpecies = useMemo(() => {
        if (!moduleData?.predefinedSpeciesList || !speciesSearch) return [];
        const term = speciesSearch.toLowerCase();
        return moduleData.predefinedSpeciesList
            .filter(s =>
                s.scientificName.toLowerCase().includes(term) ||
                s.commonName.toLowerCase().includes(term)
            )
            .slice(0, 8);
    }, [moduleData, speciesSearch]);

    // Handle Species Selection + Auto Advance
    const handleSpeciesSelect = (name: string, id: string) => {
        setSpeciesName(name);
        setSpeciesSearch(name);
        setSelectedSpeciesId(id);

        // UX: If tag is already filled, auto-advance to metrics
        if (tagNumber.length >= 1) {
            setCurrentStep('METRICS');
        }
    };

    const validateTagUniqueness = async (): Promise<boolean> => {
        if (!plotId || !tagNumber) return false;
        const existingTree = await db.treeObservations
            .where({ plotId, tagNumber: tagNumber.trim().toUpperCase() })
            .first();
        return !existingTree;
    };

    const equivalentGBH = useMemo(() => {
        const validStems = stems.filter(s => s.gbh && !isNaN(parseFloat(s.gbh)));
        if (validStems.length === 0) return 0;
        const sumOfSquares = validStems.reduce((sum, stem) => {
            const gbhValue = parseFloat(stem.gbh);
            return sum + (gbhValue * gbhValue);
        }, 0);
        return Math.sqrt(sumOfSquares);
    }, [stems]);

    // Auto-Tag Logic
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
        try {
            await Haptics.impact({ style: ImpactStyle.Heavy });
        } catch (e) {
            // Fallback
        }

        const isTagUnique = await validateTagUniqueness();
        if (!isTagUnique) {
            alert(`Tag "${tagNumber.trim().toUpperCase()}" already exists.`);
            return;
        }

        const gpsResult = gpsManager.getMeasurementResult();
        const now = Date.now();
        const validStems = stems
            .filter(s => s.gbh && !isNaN(parseFloat(s.gbh)))
            .map(s => ({ id: s.id, gbh: parseFloat(s.gbh) }));

        // Validation Check
        const validationWarnings: string[] = [];
        if (equivalentGBH > gbhThreshold) validationWarnings.push(`GBH > ${gbhThreshold}cm`);
        if (height && parseFloat(height) > heightThreshold) validationWarnings.push(`Height > ${heightThreshold}m`);

        // Check for attached media (Optional validation)
        // const mediaCount = await db.media.where('parentId').equals(treeId).count();
        // if (moduleData?.validationSettings?.mandatoryPhotos && mediaCount === 0) ...

        const newTree: TreeObservation = {
            id: treeId, // [THORNE] Use the pre-generated ID
            projectId, moduleId, plotId, samplingUnitId: unitId,
            tagNumber: tagNumber.trim().toUpperCase(),
            speciesListId: selectedSpeciesId || undefined,
            speciesName: isUnknown ? (morphospeciesCode || 'Unknown') : speciesName.trim(),
            isUnknown,
            confidenceLevel: isUnknown ? 'LOW' : 'HIGH',
            gbh: equivalentGBH,
            height: height ? parseFloat(height) : undefined,
            stems: validStems.length > 1 ? validStems : undefined,
            stemCount: validStems.length,
            condition: 'ALIVE',
            phenology: 'VEGETATIVE',
            validationStatus: validationWarnings.length > 0 ? 'FLAGGED' : 'PENDING',
            remarks: validationWarnings.join('; '),
            localX: initialPosition?.x,
            localY: initialPosition?.y,
            lat: gpsResult?.lat || 0,
            lng: gpsResult?.lng || 0,
            gpsAccuracyM: gpsResult?.accuracy || 0,
            gpsSampleCount: gpsResult?.samples || 0,
            createdAt: now, updatedAt: now,
            images: [] // Images are now in 'media' table, but we keep this empty array for type compat
        };

        await db.treeObservations.add(newTree);

        // Update Unit Progress
        const existingProgress = await db.samplingUnits.where({ plotId, samplingUnitId: unitId }).first();
        if (!existingProgress) {
            await db.samplingUnits.add({ id: uuidv4(), projectId, moduleId, plotId, samplingUnitId: unitId, status: 'IN_PROGRESS', createdAt: now, lastUpdatedAt: now });
        } else if (existingProgress.status === 'NOT_STARTED') {
            await db.samplingUnits.update(existingProgress.id, { status: 'IN_PROGRESS', lastUpdatedAt: now });
        }

        if (addAnother) {
            // Reset for rapid entry
            // [THORNE] Critical: Generate NEW ID for the next tree
            setTreeId(uuidv4());

            setTagNumber((prev) => (parseInt(prev) + 1).toString());
            setSpeciesName('');
            setSpeciesSearch('');
            setMorphospeciesCode('');
            setSelectedSpeciesId(null);
            setStems([{ id: uuidv4(), gbh: '' }]);
            setHeight('');
            setCurrentStep('ID');
            gpsManager.startMeasuring();
            setGpsStats({ samples: 0, acc: null });
            onSaveSuccess();
        } else {
            onSaveSuccess();
            onClose();
        }
    };

    const canProceed = () => {
        if (currentStep === 'ID') return tagNumber && ((!isUnknown && speciesName) || (isUnknown && morphospeciesCode));
        if (currentStep === 'METRICS') return stems.some(s => s.gbh && !isNaN(parseFloat(s.gbh)));
        return true;
    };

    const stepOrder: Step[] = ['ID', 'METRICS', 'PHOTOS', 'REVIEW'];
    const currentStepIdx = stepOrder.indexOf(currentStep);
    const progressPercent = ((currentStepIdx + 1) / stepOrder.length) * 100;

    return (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-200">

            {/* MAIN CARD CONTAINER */}
            <div className="w-full h-full md:h-auto md:max-h-[85vh] md:max-w-3xl bg-app md:bg-panel border-0 md:border md:border-border md:rounded-3xl shadow-2xl flex flex-col overflow-hidden relative">

                {/* --- 1. HEADER --- */}
                <div className="flex-none px-6 py-4 border-b border-border bg-panel-soft/80 backdrop-blur-md flex items-center justify-between z-10">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={onClose}
                            className="w-8 h-8 flex items-center justify-center rounded-full bg-panel border border-border text-text-muted hover:text-text-main hover:border-primary transition-all"
                        >
                            <X size={18} />
                        </button>
                        <div>
                            <div className="text-[10px] font-bold text-primary uppercase tracking-widest flex items-center gap-1.5">
                                <Target size={12} /> {unitLabel}
                            </div>
                            <div className="text-sm font-bold text-text-main flex items-center gap-2">
                                New Tree Entry
                                {gpsStats.acc && (
                                    <span className={clsx("text-[10px] font-mono px-1.5 py-0.5 rounded border", gpsStats.acc < 5 ? "bg-success/10 border-success/20 text-success" : "bg-warning/10 border-warning/20 text-warning")}>
                                        GPS ±{gpsStats.acc.toFixed(1)}m
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Step Tracker */}
                    <div className="hidden sm:flex items-center gap-2">
                        {stepOrder.map((s, i) => (
                            <div key={s} className={clsx("w-2 h-2 rounded-full transition-all", i === currentStepIdx ? "bg-primary scale-125" : i < currentStepIdx ? "bg-success" : "bg-border")} />
                        ))}
                    </div>
                </div>

                {/* --- 2. PROGRESS BAR (Mobile) --- */}
                <div className="h-1 w-full bg-panel-soft sm:hidden">
                    <div className="h-full bg-primary transition-all duration-300" style={{ width: `${progressPercent}%` }} />
                </div>

                {/* --- 3. SCROLLABLE CONTENT --- */}
                <div className="flex-1 overflow-y-auto p-4 md:p-8 relative bg-app md:bg-panel">
                    <div className="max-w-xl mx-auto h-full flex flex-col">
                        {currentStep === 'ID' && (
                            <IdStep
                                tagNumber={tagNumber} setTagNumber={setTagNumber}
                                speciesName={speciesName} setSpeciesName={setSpeciesName}
                                speciesSearch={speciesSearch} setSpeciesSearch={setSpeciesSearch}
                                selectedSpeciesId={selectedSpeciesId} setSelectedSpeciesId={setSelectedSpeciesId}
                                isUnknown={isUnknown} setIsUnknown={setIsUnknown}
                                morphospeciesCode={morphospeciesCode} setMorphospeciesCode={setMorphospeciesCode}
                                filteredSpecies={filteredSpecies}
                                onSelectSpecies={handleSpeciesSelect}
                                onNext={() => setCurrentStep('METRICS')}
                            />
                        )}
                        {currentStep === 'METRICS' && (
                            <MetricsStep
                                stems={stems} setStems={setStems}
                                height={height} setHeight={setHeight}
                                equivalentGBH={equivalentGBH}
                                onNext={() => setCurrentStep('PHOTOS')}
                            />
                        )}
                        {currentStep === 'PHOTOS' && (
                            <PhotosStep
                                // [THORNE] Passing Stable ID + Stubbing old props for compatibility
                                treeId={treeId}
                                hasBarkPhoto={hasBarkPhoto} setHasBarkPhoto={() => { }}
                                hasLeafPhoto={hasLeafPhoto} setHasLeafPhoto={() => { }}
                                onNext={() => setCurrentStep('REVIEW')}
                            />
                        )}
                        {currentStep === 'REVIEW' && (
                            <ReviewStep
                                tagNumber={tagNumber} speciesName={speciesName}
                                isUnknown={isUnknown} morphospeciesCode={morphospeciesCode}
                                stems={stems} equivalentGBH={equivalentGBH}
                                hasBarkPhoto={hasBarkPhoto} hasLeafPhoto={hasLeafPhoto}
                                height={height}
                                validationWarnings={
                                    (() => {
                                        const warnings = [];
                                        if (equivalentGBH > gbhThreshold) warnings.push(`GBH > ${gbhThreshold}cm`);
                                        if (height && parseFloat(height) > heightThreshold) warnings.push(`Height > ${heightThreshold}m`);
                                        return warnings;
                                    })()
                                }
                                onNext={() => setCurrentStep('ID')}
                            />
                        )}
                    </div>
                </div>

                {/* --- 4. COMMAND BAR (Footer) --- */}
                <div className="flex-none p-4 md:p-6 bg-panel-soft/80 backdrop-blur-xl border-t border-border z-20 pb-safe">
                    <div className="flex gap-4 max-w-xl mx-auto">

                        {/* BACK */}
                        {currentStep !== 'ID' && (
                            <button
                                onClick={() => setCurrentStep(stepOrder[currentStepIdx - 1])}
                                className="w-14 h-14 rounded-2xl flex items-center justify-center bg-panel border border-border text-text-muted hover:text-text-main hover:bg-panel-soft active:scale-95 transition-all"
                            >
                                <ArrowLeft size={24} />
                            </button>
                        )}

                        {/* NEXT / SAVE */}
                        {currentStep !== 'REVIEW' ? (
                            <button
                                onClick={() => setCurrentStep(stepOrder[currentStepIdx + 1])}
                                disabled={!canProceed()}
                                className={clsx(
                                    "flex-1 h-14 rounded-2xl flex items-center justify-center gap-3 font-bold text-lg transition-all shadow-lg active:scale-[0.98]",
                                    canProceed()
                                        ? "bg-primary text-white shadow-primary/20 hover:bg-primary/90"
                                        : "bg-panel border border-border text-text-muted cursor-not-allowed opacity-60"
                                )}
                            >
                                Next Step <ChevronRight size={24} strokeWidth={3} />
                            </button>
                        ) : (
                            <div className="flex-1 flex gap-3">
                                <button
                                    onClick={() => handleSave(true)}
                                    className="flex-1 h-14 rounded-2xl bg-panel border-2 border-primary text-primary font-bold flex flex-col items-center justify-center leading-none gap-1 active:scale-95 transition-all hover:bg-primary/5"
                                >
                                    <CopyPlus size={20} />
                                    <span className="text-[10px] uppercase tracking-wider">Save & Add</span>
                                </button>
                                <button
                                    onClick={() => handleSave(false)}
                                    className="flex-[1.5] h-14 rounded-2xl bg-success text-white font-bold text-lg flex items-center justify-center gap-2 shadow-lg shadow-success/20 active:scale-95 transition-all hover:bg-success/90"
                                >
                                    <Save size={24} strokeWidth={2.5} />
                                    Finish
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};