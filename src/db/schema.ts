export type SyncStatus = 'LOCAL_ONLY' | 'SYNCED' | 'DIRTY' | 'CONFLICT';

export interface SyncMeta {
    syncStatus: SyncStatus;
    lastModifiedAt: number;
    lastModifiedBy: string; // Device ID
    remoteId?: string;
}

// --- 1. Project ---
export interface Project {
    id: string; // UUID
    name: string;
    description: string;

    // People & Access
    ownerId: string;
    ownerName: string;
    collaborators: { id: string; name: string; role: 'EDITOR' | 'VIEWER' }[];

    // Global Settings
    createdAt: number;
    updatedAt: number;
    sync: SyncMeta;
}

// --- 2. Modules ---
export type ModuleType = 'VEGETATION_PLOTS' | 'BIRD_SURVEY' | 'WATER_QUALITY';

export interface BaseModule {
    id: string;
    projectId: string;
    type: ModuleType;
    name: string;
    status: 'ACTIVE' | 'ARCHIVED';
    createdAt: number;
    updatedAt: number;
    sync: SyncMeta;
}

export interface VegetationModule extends BaseModule {
    type: 'VEGETATION_PLOTS';

    // The Science
    samplingMethod: 'RANDOM' | 'SYSTEMATIC' | 'TRANSECT';

    // Versioning
    protocolVersion?: number;

    // Master Lists
    predefinedSpeciesList?: {
        id: string;
        scientificName: string;
        commonName: string;
        family?: string;
        type: 'TREE' | 'SHRUB' | 'HERB' | 'ALL';
    }[];

    // Definitions
    strataRules?: {
        minTreeGbhCm?: number;
        minShrubHeightCm?: number;
    };

    // Validation
    validationSettings: {
        maxGpsAccuracyM?: number;
        mandatoryPhotos: boolean;
    };

    // Custom Attributes
    customPlotAttributes: {
        key: string;
        label: string;
        inputType: 'text' | 'number' | 'select';
        options?: string[];
    }[];

    // Defaults
    defaultBlueprintId?: string;
    defaultBlueprintVersion?: number;
}

export type Module = VegetationModule; // Union type for future modules

// --- 3. Plot ---
export interface Plot {
    id: string;
    projectId: string;
    moduleId: string;

    // Configuration
    blueprintId: string;
    blueprintVersion: number;
    protocolVersion?: number;

    // Identification
    name: string; // "P-101"
    code: string; // Short code

    // Geometry & Location
    coordinates: {
        lat: number;
        lng: number;
        accuracyM: number;
        altitude?: number;
    };
    orientation: number; // 0-360

    // Topography & Habitat
    slope: number; // Degrees
    aspect: string; // "N", "NE"
    habitatType: string;

    groundCover?: {
        rockPercent: number;
        bareSoilPercent: number;
        litterPercent: number;
        vegetationPercent: number;
    };

    disturbanceType?: 'NONE' | 'FIRE' | 'GRAZING' | 'CUTTING' | 'OTHER';

    // Images
    images: Array<{
        id: string;
        url: string;
        type: 'SITE_CONTEXT' | 'CANOPY' | 'SOIL';
        label?: string;
        timestamp: number;
        samplingUnitId?: string;
    }>;

    // Metadata
    status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'ARCHIVED';
    surveyors: string[];
    surveyDate: string; // ISO
    startTime?: number;
    endTime?: number;

    customAttributes: Record<string, any>;

    createdAt: number;
    updatedAt: number;
    sync: SyncMeta;
}

// --- 4. Spatial Units (Runtime) ---
export interface SamplingUnitProgress {
    id: string;
    projectId: string;
    moduleId: string;
    plotId: string;
    samplingUnitId: string; // Links to PlotNodeInstance.id
    status: 'NOT_STARTED' | 'IN_PROGRESS' | 'DONE';

    createdAt: number;
    lastUpdatedAt: number;
    sync: SyncMeta;
}

// --- 5. Observations ---
export type ValidationStatus = 'PENDING' | 'VERIFIED' | 'FLAGGED';

export interface TreeObservation {
    id: string;
    projectId: string;
    moduleId: string;
    plotId: string;

    // Location
    samplingUnitId: string;

    // Identification
    tagNumber: string;
    speciesListId?: string;
    speciesName: string;
    commonName?: string;

    isUnknown: boolean;
    confidenceLevel: 'HIGH' | 'MEDIUM' | 'LOW';

    // Metrics
    gbh?: number;
    height?: number;
    crownDiameter?: number;

    // Multi-Stem
    stems?: Array<{
        id: string;
        gbh: number;
    }>;
    stemCount: number;

    // Health & Phenology
    condition: 'ALIVE' | 'DEAD' | 'DAMAGED' | 'DYING';
    phenology: 'VEGETATIVE' | 'FLOWERING' | 'FRUITING' | 'SENESCING';

    // Spatial
    localX?: number;
    localY?: number;

    // Media
    images: Array<{
        url: string;
        type: 'BARK' | 'LEAF' | 'FULL' | 'FRUIT';
    }>;

    remarks?: string;
    surveyorId?: string;
    validationStatus: ValidationStatus;

    createdAt: number;
    updatedAt: number;
    sync: SyncMeta;
}

export interface VegetationObservation {
    id: string;
    projectId: string;
    moduleId: string;
    plotId: string;

    // Location
    samplingUnitId: string;

    // Classification
    speciesListId?: string;
    speciesName: string;
    growthForm: 'HERB' | 'SHRUB' | 'CLIMBER' | 'GRASS' | 'FERN';

    // Quantitative
    abundanceCount?: number;
    coverPercentage?: number;

    // Qualitative
    avgHeightCm?: number;

    // Verification
    isUnknown: boolean;
    confidenceLevel?: 'HIGH' | 'MEDIUM' | 'LOW';

    images: Array<{
        url: string;
        type?: 'CANOPY' | 'GROUND' | 'CLOSEUP';
    }>;

    validationStatus: ValidationStatus;

    createdAt: number;
    updatedAt: number;
    sync: SyncMeta;
}

