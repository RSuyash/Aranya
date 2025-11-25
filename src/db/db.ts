import Dexie, { type Table } from 'dexie';
import type { Project, Module, Plot, TreeObservation, VegetationObservation, SamplingUnitProgress } from './schema';

export class ProjectTerraDB extends Dexie {
    projects!: Table<Project>;
    modules!: Table<Module>;
    plots!: Table<Plot>;
    treeObservations!: Table<TreeObservation>;
    vegetationObservations!: Table<VegetationObservation>;
    samplingUnitProgress!: Table<SamplingUnitProgress>;

    constructor() {
        super('ProjectTerraDB_v1');

        this.version(1).stores({
            projects: 'id, name, sync.syncStatus',
            modules: 'id, projectId, type, status',
            plots: 'id, projectId, moduleId, blueprintId, surveyDate, status, sync.syncStatus',
            treeObservations: 'id, projectId, moduleId, plotId, samplingUnitId, [plotId+tagNumber], sync.syncStatus',
            vegetationObservations: 'id, projectId, moduleId, plotId, samplingUnitId, sync.syncStatus',
            samplingUnitProgress: 'id, [plotId+samplingUnitId], moduleId, sync.syncStatus'
        });
    }
}

export const db = new ProjectTerraDB();
