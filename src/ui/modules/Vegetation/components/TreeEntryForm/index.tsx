import React, { useState, useEffect, useMemo } from 'react';
import { X, Activity, CheckCircle, MapPin } from 'lucide-react';
import { gpsManager } from '../../../../../utils/gps/GPSManager';
import { db } from '../../../../../core/data-model/dexie';
import { v4 as uuidv4 } from 'uuid';
import type { TreeObservation, VegetationModule } from '../../../../../core/data-model/types';
import { useLiveQuery } from 'dexie-react-hooks';
import type { TreeEntryFormProps, Step } from './types';
import { StepIndicator } from './components/StepIndicator';
import { IdStep } from './components/IdStep';
import { MetricsStep } from './components/MetricsStep';
import { PhotosStep } from './components/PhotosStep';
import { ReviewStep } from './components/ReviewStep';

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

    // Form State
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
    const [hasBarkPhoto, setHasBarkPhoto] = useState(false);
    const [hasLeafPhoto, setHasLeafPhoto] = useState(false);

    // GPS Stats State
    const [gpsStats, setGpsStats] = useState<{ samples: number, acc: number | null }>({ samples: 0, acc: null });

    // 1. LIFECYCLE HOOK: Manage GPS State
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

    // Fetch module data
    const moduleData = useLiveQuery(() => db.modules.get(moduleId)) as VegetationModule | undefined;

    // Filter species
    const filteredSpecies = useMemo(() => {
        if (!moduleData?.predefinedSpeciesList || !speciesSearch) return [];
        const term = speciesSearch.toLowerCase();
        return moduleData.predefinedSpeciesList
            .filter(s =>
                s.scientificName.toLowerCase().includes(term) ||
                s.commonName.toLowerCase().includes(term)
            )
            .slice(0, 10);
    }, [moduleData, speciesSearch]);

    // Validation thresholds
    const heightThreshold = moduleData?.validationSettings?.maxExpectedHeightM || 70;
    const gbhThreshold = moduleData?.validationSettings?.maxExpectedGbhCm || 500;

    // Biometric validation
    const validationWarnings = useMemo(() => {
        const warnings: string[] = [];
        stems.forEach((s, i) => {
            const val = parseFloat(s.gbh);
            if (!isNaN(val)) {
                if (val < 1) warnings.push(`Stem ${i + 1}: GBH ${val}cm is too small (likely <1cm).`);
                else if (val > gbhThreshold) warnings.push(`Stem ${i + 1}: GBH ${val}cm is unusually large (>${gbhThreshold}cm).`);
            }
        });
        const h = parseFloat(height);
        if (!isNaN(h)) {
            if (h > heightThreshold) warnings.push(`Height ${h}m is exceptionally tall (>${heightThreshold}m for this biome).`);
            else if (h < 0.1 && h !== 0) warnings.push(`Height ${h}m is unusually small (likely >0.1m).`);
        }
        return warnings;
    }, [stems, height, heightThreshold, gbhThreshold]);

    const hasBiometricWarnings = validationWarnings.length > 0;

    // Validate tag uniqueness
    const validateTagUniqueness = async (): Promise<boolean> => {
        if (!plotId || !tagNumber) return false;
        const existingTree = await db.treeObservations
            .where({ plotId, tagNumber: tagNumber.trim().toUpperCase() })
            .first();
        return !existingTree;
    };

    // Calculate equivalent GBH
    const equivalentGBH = useMemo(() => {
        const validStems = stems.filter(s => s.gbh && !isNaN(parseFloat(s.gbh)));
        if (validStems.length === 0) return 0;
        const sumOfSquares = validStems.reduce((sum, stem) => {
            const gbhValue = parseFloat(stem.gbh);
            return sum + (gbhValue * gbhValue);
        }, 0);
        return Math.sqrt(sumOfSquares);
    }, [stems]);

    // Auto-suggest next tag
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
        const isTagUnique = await validateTagUniqueness();
        if (!isTagUnique) {
            alert(`Tag "${tagNumber.trim().toUpperCase()}" already exists in this plot.`);
            return;
        }

        const gpsResult = gpsManager.getMeasurementResult();
        const now = Date.now();
        const cleanTag = tagNumber.trim().toUpperCase();
        const cleanSpeciesName = isUnknown
            ? (morphospeciesCode || 'Unknown Specimen').trim()
            : speciesName.trim();
        const cleanHeight = height ? parseFloat(height) : undefined;
        const validStems = stems
            .filter(s => s.gbh && !isNaN(parseFloat(s.gbh)))
            .map(s => ({ id: s.id, gbh: parseFloat(s.gbh) }));

        const status = hasBiometricWarnings ? 'FLAGGED' : 'PENDING';
        const remarks = hasBiometricWarnings ? validationWarnings.join('; ') : undefined;

        const newTree: TreeObservation = {
            id: uuidv4(),
            projectId,
            moduleId,
            plotId,
            samplingUnitId: unitId,
            tagNumber: cleanTag,
            speciesListId: selectedSpeciesId || undefined,
            speciesName: cleanSpeciesName,
            isUnknown,
            confidenceLevel: isUnknown ? 'LOW' : 'HIGH',
            gbh: equivalentGBH,
            height: cleanHeight,
            stems: validStems.length > 1 ? validStems : undefined,
            stemCount: validStems.length,
            condition: 'ALIVE',
            phenology: 'VEGETATIVE',
            validationStatus: status,
            remarks,
            localX: initialPosition?.x,
            localY: initialPosition?.y,
            lat: gpsResult?.lat || 0,
            lng: gpsResult?.lng || 0,
            gpsAccuracyM: gpsResult?.accuracy || 0,
            gpsSampleCount: gpsResult?.samples || 0,
            createdAt: now,
            updatedAt: now,
            images: []
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
            setTagNumber((prev) => (parseInt(prev) + 1).toString());
            setSpeciesName('');
            setSpeciesSearch('');
            setMorphospeciesCode('');
            setSelectedSpeciesId(null);
            setStems([{ id: uuidv4(), gbh: '' }]);
            setHeight('');
            setHasBarkPhoto(false);
            setHasLeafPhoto(false);
            setCurrentStep('ID');
            gpsManager.startMeasuring();
            setGpsStats({ samples: 0, acc: null });
            onSaveSuccess();
        } else {
            onSaveSuccess();
            onClose();
        }
    };

    const getAccuracyColor = (acc: number | null, samples: number) => {
        if (!acc) return 'text-text-muted border-border';
        if (samples < 10) return 'text-warning border-warning/30';
        if (acc < 2.0) return 'text-success border-success/30';
        if (acc < 5.0) return 'text-primary border-primary/30';
        return 'text-danger border-danger/30';
    };

    return (
        <div className="fixed inset-0 z-[60] bg-app flex flex-col animate-in slide-in-from-bottom duration-300">
            {/* Header */}
            <div className="px-4 py-4 border-b border-border flex items-center justify-between bg-panel">
                <div className="flex items-center gap-3">
                    <button onClick={onClose} className="text-text-muted hover:text-text-main">
                        <X className="w-6 h-6" />
                    </button>
                    <div>
                        <h2 className="text-lg font-bold text-text-main">New Tree</h2>
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
                <div className="flex items-center gap-3">
                    <div className="text-xs font-mono text-primary bg-panel-soft px-2 py-1 rounded border border-primary/20">
                        TAG: {tagNumber || '...'}
                    </div>

                    {/* LIVE GPS PILL */}
                    <div className={`flex items-center gap-2 px-3 py-1 rounded-full border bg-panel text-xs font-mono transition-colors ${getAccuracyColor(gpsStats.acc, gpsStats.samples)}`}>
                        {gpsStats.samples < 10 ? (
                            <Activity className="w-3 h-3 animate-pulse" />
                        ) : gpsStats.acc && gpsStats.acc < 3 ? (
                            <CheckCircle className="w-3 h-3" />
                        ) : (
                            <MapPin className="w-3 h-3" />
                        )}

                        <span>
                            {gpsStats.samples === 0 ? "Acquiring GPS..." :
                                `n=${gpsStats.samples} ±${gpsStats.acc?.toFixed(1)}m`}
                        </span>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
                <StepIndicator currentStep={currentStep} />

                <div className="max-w-md mx-auto h-full">
                    {currentStep === 'ID' && (
                        <IdStep
                            tagNumber={tagNumber}
                            setTagNumber={setTagNumber}
                            speciesName={speciesName}
                            setSpeciesName={setSpeciesName}
                            speciesSearch={speciesSearch}
                            setSpeciesSearch={setSpeciesSearch}
                            selectedSpeciesId={selectedSpeciesId}
                            setSelectedSpeciesId={setSelectedSpeciesId}
                            isUnknown={isUnknown}
                            setIsUnknown={setIsUnknown}
                            morphospeciesCode={morphospeciesCode}
                            setMorphospeciesCode={setMorphospeciesCode}
                            filteredSpecies={filteredSpecies}
                            onNext={() => setCurrentStep('METRICS')}
                            onCancel={onClose}
                        />
                    )}

                    {currentStep === 'METRICS' && (
                        <MetricsStep
                            stems={stems}
                            setStems={setStems}
                            height={height}
                            setHeight={setHeight}
                            equivalentGBH={equivalentGBH}
                            onNext={() => {
                                const hasValidStem = stems.some(s => s.gbh && !isNaN(parseFloat(s.gbh)));
                                if (hasValidStem) setCurrentStep('PHOTOS');
                            }}
                            onBack={() => setCurrentStep('ID')}
                        />
                    )}

                    {currentStep === 'PHOTOS' && (
                        <PhotosStep
                            hasBarkPhoto={hasBarkPhoto}
                            setHasBarkPhoto={setHasBarkPhoto}
                            hasLeafPhoto={hasLeafPhoto}
                            setHasLeafPhoto={setHasLeafPhoto}
                            onNext={() => setCurrentStep('REVIEW')}
                            onBack={() => setCurrentStep('METRICS')}
                        />
                    )}

                    {currentStep === 'REVIEW' && (
                        <ReviewStep
                            tagNumber={tagNumber}
                            speciesName={speciesName}
                            isUnknown={isUnknown}
                            morphospeciesCode={morphospeciesCode}
                            stems={stems}
                            equivalentGBH={equivalentGBH}
                            hasBarkPhoto={hasBarkPhoto}
                            hasLeafPhoto={hasLeafPhoto}
                            validationWarnings={validationWarnings}
                            onBack={() => setCurrentStep('PHOTOS')}
                            onNext={() => { }}
                            onSave={handleSave}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};
