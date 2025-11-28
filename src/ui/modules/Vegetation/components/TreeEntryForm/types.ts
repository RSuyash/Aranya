
export type Step = 'ID' | 'METRICS' | 'PHOTOS' | 'REVIEW';

export interface TreeEntryFormProps {
    projectId: string;
    moduleId: string;
    plotId: string;
    unitId: string;
    unitLabel: string;
    initialPosition?: { x: number, y: number };
    onClose: () => void;
    onSaveSuccess: () => void;
}

export interface StepProps {
    onNext?: () => void;
    onBack?: () => void;
}

// Extended interfaces for specific step components
export interface IdStepProps extends StepProps {
    tagNumber: string;
    setTagNumber: (val: string) => void;
    speciesName: string;
    setSpeciesName: (val: string) => void;
    speciesSearch: string;
    setSpeciesSearch: (val: string) => void;
    selectedSpeciesId: string | null;
    setSelectedSpeciesId: (val: string | null) => void;
    isUnknown: boolean;
    setIsUnknown: (val: boolean) => void;
    morphospeciesCode: string;
    setMorphospeciesCode: (val: string) => void;
    filteredSpecies: Array<{ id: string; scientificName: string; commonName: string }>;
    onSelectSpecies: (name: string, id: string) => void;
}

export interface MetricsStepProps extends StepProps {
    stems: Array<{ id: string; gbh: string }>;
    setStems: (stems: Array<{ id: string; gbh: string }>) => void;
    height: string;
    setHeight: (val: string) => void;
    equivalentGBH: number;
}

export interface PhotosStepProps extends StepProps {
    hasBarkPhoto: boolean;
    setHasBarkPhoto: (val: boolean) => void;
    hasLeafPhoto: boolean;
    setHasLeafPhoto: (val: boolean) => void;
}

export interface ReviewStepProps extends StepProps {
    tagNumber: string;
    speciesName: string;
    isUnknown: boolean;
    morphospeciesCode: string;
    stems: Array<{ id: string; gbh: string }>;
    equivalentGBH: number;
    hasBarkPhoto: boolean;
    hasLeafPhoto: boolean;
    height: string;
    validationWarnings?: string[];
}