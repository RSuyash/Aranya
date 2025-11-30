import Dexie, { type Table } from 'dexie';
import type {
    Project,
    VegetationModule,
    Plot,
    TreeObservation,
    VegetationObservation,
    SamplingUnitProgress,
    AnalysisConfig,
    SurveyTrack,
} from './types';

// [THORNE] New Interface for dedicated media storage
export interface MediaItem {
    id: string;
    parentId: string; // Links to Tree/Veg ID
    type: string;     // 'BARK', 'LEAF', 'GROUND', etc.
    blob: Blob;       // The raw binary data
    mimeType: string;
    timestamp: number;
    synced: boolean;
}

export class AranyaDB extends Dexie {
    projects!: Table<Project, string>;
    modules!: Table<VegetationModule, string>;
    plots!: Table<Plot, string>;
    treeObservations!: Table<TreeObservation, string>;
    vegetationObservations!: Table<VegetationObservation, string>;
    samplingUnits!: Table<SamplingUnitProgress, string>;
    analysisConfigs!: Table<AnalysisConfig, string>;
    surveyTracks!: Table<SurveyTrack, string>;
    media!: Table<MediaItem, string>; // [THORNE] New Table

    constructor() {
        super('ProjectTerraDB_v1');

        this.version(7).stores({ // Incremented Version
            projects: 'id, name, syncStatus',
            modules: 'id, projectId, type',
            plots: 'id, projectId, moduleId, syncStatus, [syncStatus+lastModifiedAt]',
            treeObservations:
                'id, projectId, moduleId, plotId, samplingUnitId, tagNumber, speciesId, speciesName, [plotId+tagNumber], createdAt, updatedAt, syncStatus, [syncStatus+lastModifiedAt], [plotId+samplingUnitId]',
            vegetationObservations:
                'id, projectId, moduleId, plotId, speciesName, syncStatus, [syncStatus+lastModifiedAt]',
            samplingUnits: 'id, projectId, plotId, moduleId, [plotId+samplingUnitId]',
            analysisConfigs: 'id, projectId, moduleId, type',
            surveyTracks: 'id, projectId, moduleId, surveyorId, [projectId+moduleId]',
            media: 'id, parentId, type, timestamp, [parentId+type]' // [THORNE] Optimized indices
        });
    }
}

export const db = new AranyaDB();