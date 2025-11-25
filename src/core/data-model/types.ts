export type ModuleType = 'VEGETATION_PLOTS' | 'BIRD_SURVEY' | 'WATER_QUALITY';

export type SyncStatus = 'LOCAL_ONLY' | 'SYNCED' | 'DIRTY' | 'CONFLICT';

export type ValidationStatus = 'PENDING' | 'VERIFIED' | 'FLAGGED';

export interface PlotVisualizationSettings {
    showQuadrants: boolean;
    showSubplots: boolean;
    showQuadrantLines: boolean;
    showTreeVisualization: boolean;
    showLabels: boolean;
    subplotOpacity: number; // 0-1
}

export interface Project {
    id: string; // UUID
    name: string; // e.g. "Pune Metro EIA 2025"
    description: string;

    // --- People & Access ---
    ownerId: string;
    ownerName: string;
    collaborators: { id: string; name: string; role: 'EDITOR' | 'VIEWER' }[];

    // --- Global Settings ---
    createdAt: number;
    updatedAt: number;
    syncStatus?: SyncStatus;
}

export interface BaseModule {
    id: string;
    projectId: string;
    type: ModuleType;
    name: string;
    status: 'ACTIVE' | 'ARCHIVED';
    createdAt: number;
    updatedAt: number;
}

// --- Vegetation Module (formerly "Project") ---
export interface VegetationModule extends BaseModule {
    type: 'VEGETATION_PLOTS';

    // --- The Science ---
    samplingMethod: 'RANDOM' | 'SYSTEMATIC' | 'TRANSECT';

    // --- Versioning (Future-Proofing) ---
    protocolVersion?: number; // Increments when rules/validation change

    // --- Master Lists ---
    predefinedSpeciesList?: {
        id: string;
        scientificName: string;
        commonName: string;
        family?: string;
        type: 'TREE' | 'SHRUB' | 'HERB' | 'ALL';
    }[];

    // --- Definitions (Strata) ---
    strataRules?: {
        minTreeGbhCm?: number;
        minShrubHeightCm?: number;
    };

    // --- Validation & Config ---
    validationSettings: {
        maxGpsAccuracyM?: number;
        mandatoryPhotos: boolean;
        maxExpectedHeightM?: number;  // Maximum expected tree height for the project/biome
        maxExpectedGbhCm?: number;    // Maximum expected GBH for the project/biome
    };

    // --- Custom Attributes ---
    customPlotAttributes: {
        key: string;
        label: string;
        inputType: 'text' | 'number' | 'select';
        options?: string[];
    }[];

    // --- Defaults ---
    defaultBlueprintId?: string;
    defaultBlueprintVersion?: number;
}

export interface Plot {
    id: string; // UUID
    projectId: string; // Root Project FK (for easy querying)
    moduleId: string;  // VegetationModule FK (The specific survey)

    // --- Configuration ---
    blueprintId: string;
    blueprintVersion: number;
    protocolVersion?: number; // [Optional] Snapshot of module protocol version at creation

    // --- Identification ---
    name: string; // "P-101"
    code: string; // Short code for labels

    // --- Geometry & Location ---
    coordinates: {
        lat: number;
        lng: number;
        accuracyM: number;
        altitude?: number;
    };

    orientation: number; // 0-360 degrees (Azimuth)

    // --- Topography & Habitat ---
    slope: number; // Degrees
    aspect: string; // "N", "NE", "SW"
    habitatType: string;

    groundCover?: {
        rockPercent: number;
        bareSoilPercent: number;
        litterPercent: number;
        vegetationPercent: number;
    };

    disturbanceType?: 'NONE' | 'FIRE' | 'GRAZING' | 'CUTTING' | 'OTHER';

    // --- Images ---
    images: Array<{
        id: string;
        url: string;
        type: 'SITE_CONTEXT' | 'CANOPY' | 'SOIL';
        label?: string;
        timestamp: number; // epochMillis
        samplingUnitId?: string; // Link to specific quadrant/subplot
    }>;

    // --- Metadata ---
    status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'ARCHIVED';
    surveyors: string[];
    surveyDate: string; // ISO "YYYY-MM-DD"
    startTime?: number; // epochMillis
    endTime?: number;   // epochMillis

    // Note: Can be tightened to Record<string, string | number | boolean | null> later.
    customAttributes: Record<string, any>;

    createdAt: number;
    updatedAt: number;

    // --- Visualization Settings ---
    visualizationSettings?: PlotVisualizationSettings;

    // Sync Meta
    syncStatus?: SyncStatus;
    lastModifiedAt?: number;
}

export interface SamplingUnitProgress {
    id: string; // UUID
    projectId: string;
    moduleId: string; // [NEW]
    plotId: string;
    samplingUnitId: string; // Links to PlotNodeInstance.id
    status: 'NOT_STARTED' | 'IN_PROGRESS' | 'DONE';

    createdAt: number;
    lastUpdatedAt: number;
}

export interface TreeObservation {
    id: string;
    projectId: string; // Root Project FK
    moduleId: string;  // VegetationModule FK
    plotId: string;

    // --- Location ---
    samplingUnitId: string; // Links to PlotNodeInstance.id

    // --- Identification ---
    tagNumber: string; // Unique per Plot
    speciesListId?: string; // Optional FK to VegetationModule.predefinedSpeciesList.id
    speciesName: string; // Denormalized human-readable name
    commonName?: string;

    isUnknown: boolean;
    confidenceLevel: 'HIGH' | 'MEDIUM' | 'LOW';

    // --- Metrics ---
    // If stems is undefined: gbh = single stem GBH.
    // If stems is defined: gbh = equivalent GBH computed from stems (e.g. sqrt(sum(gbh^2))).
    gbh?: number;
    height?: number; // m
    crownDiameter?: number; // m

    // --- Multi-Stem Logic ---
    // Detailed recording of individual stems
    stems?: Array<{
        id: string; // UUID for stable editing
        gbh: number; // cm
    }>;
    // UI/display only. Derived from stems.length (if stems) or defaults to 1.
    // NON-EDITABLE in UI. Always recalculated on save.
    stemCount: number;

    // --- Health & Phenology ---
    condition: 'ALIVE' | 'DEAD' | 'DAMAGED' | 'DYING';
    phenology: 'VEGETATIVE' | 'FLOWERING' | 'FRUITING' | 'SENESCING';

    // --- Spatial (Optional) ---
    localX?: number; // Relative to Sampling Unit origin
    localY?: number;

    // --- Media ---
    images: Array<{
        url: string;
        type: 'BARK' | 'LEAF' | 'FULL' | 'FRUIT';
    }>;

    remarks?: string;
    surveyorId?: string;
    validationStatus: ValidationStatus;

    createdAt: number;
    updatedAt: number;

    // Sync Meta
    syncStatus?: SyncStatus;
    lastModifiedAt?: number;
}

export interface VegetationObservation {
    id: string;
    projectId: string;
    moduleId: string;
    plotId: string;

    // --- Location ---
    samplingUnitId: string;

    // --- Classification ---
    speciesListId?: string; // Optional FK
    speciesName: string;
    growthForm: 'HERB' | 'SHRUB' | 'CLIMBER' | 'GRASS' | 'FERN';

    // --- Quantitative Data ---
    abundanceCount?: number;
    coverPercentage?: number;

    // --- Qualitative Data ---
    avgHeightCm?: number;

    // --- Verification ---
    isUnknown: boolean;
    confidenceLevel?: 'HIGH' | 'MEDIUM' | 'LOW'; // Added for symmetry

    images: Array<{
        url: string;
        type?: 'CANOPY' | 'GROUND' | 'CLOSEUP';
    }>;

    validationStatus: ValidationStatus; // Unified status

    createdAt: number;
    updatedAt: number;

    // Sync Meta
    syncStatus?: SyncStatus;
    lastModifiedAt?: number;
}

export interface SyncMeta {
    syncStatus: SyncStatus;
    lastModifiedAt: number;
    lastModifiedBy: string; // Device ID
    remoteId?: string; // UUID from server
}

export interface AnalysisConfig {
    id: string;
    projectId: string;
    moduleId: string; // The VegetationModule this analysis belongs to
    type: 'SAC_SPATIAL' | 'SAC_RANDOM';
    name: string; // "North Slope Curve"

    // For Spatial SAC: Ordered list of plots
    plotSequence?: string[]; // [PlotId1, PlotId2, ...]

    // For Random SAC (optional)
    iterations?: number;  // e.g. 100
    randomSeed?: string;  // optional for reproducibility

    createdAt: number;
    updatedAt: number;
}
