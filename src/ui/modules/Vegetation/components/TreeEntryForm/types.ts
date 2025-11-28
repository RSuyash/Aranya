import type { VegetationModule } from '../../../../../core/data-model/types';

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
    onNext: () => void;
    onBack?: () => void;
}
