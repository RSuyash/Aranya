import Dexie, { type Table } from 'dexie';
import type {
    Project,
    VegetationModule,
    Plot,
    TreeObservation,
    VegetationObservation,
    SamplingUnitProgress,
    AnalysisConfig,
} from './types';

export class AranyaDB extends Dexie {
    projects!: Table<Project, string>;
    modules!: Table<VegetationModule, string>;
    plots!: Table<Plot, string>;
    treeObservations!: Table<TreeObservation, string>;
    vegetationObservations!: Table<VegetationObservation, string>;
    samplingUnits!: Table<SamplingUnitProgress, string>;
    analysisConfigs!: Table<AnalysisConfig, string>;
    // speciesList, media, auditLogs can be added here

    constructor() {
        super('ProjectTerraDB_v1');

        this.version(2).stores({
            projects: 'id, name, syncStatus',
            modules: 'id, projectId, type',
            plots: 'id, projectId, moduleId, syncStatus, [syncStatus+lastModifiedAt]',
            treeObservations:
                'id, projectId, moduleId, plotId, syncStatus, [syncStatus+lastModifiedAt], [plotId+samplingUnitId]',
            vegetationObservations:
                'id, projectId, moduleId, plotId, syncStatus, [syncStatus+lastModifiedAt]',
            samplingUnits: 'id, projectId, plotId, moduleId, [plotId+samplingUnitId]',
            analysisConfigs: 'id, projectId, moduleId, type',
            // speciesList: 'id, projectId, moduleId, scientificName',
            // media: 'id, relatedId, type, syncStatus',
            // auditLogs: '++id, changedAt, changedBy',
        });
    }
}

export const db = new AranyaDB();
