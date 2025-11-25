import { db } from '../../db/db';
import type { Project, Module, Plot, TreeObservation, VegetationObservation, SamplingUnitProgress } from '../../db/schema';

export interface ProjectExportData {
    version: number;
    timestamp: number;
    project: Project;
    modules: Module[];
    plots: Plot[];
    treeObservations: TreeObservation[];
    vegetationObservations: VegetationObservation[];
    samplingUnitProgress: SamplingUnitProgress[];
}

export const exportProject = async (projectId: string): Promise<Blob> => {
    return await db.transaction('r', [
        db.projects,
        db.modules,
        db.plots,
        db.treeObservations,
        db.vegetationObservations,
        db.samplingUnitProgress
    ], async () => {
        const project = await db.projects.get(projectId);
        if (!project) {
            throw new Error(`Project with ID ${projectId} not found`);
        }

        const modules = await db.modules.where('projectId').equals(projectId).toArray();
        const plots = await db.plots.where('projectId').equals(projectId).toArray();
        const treeObservations = await db.treeObservations.where('projectId').equals(projectId).toArray();
        const vegetationObservations = await db.vegetationObservations.where('projectId').equals(projectId).toArray();
        const samplingUnitProgress = await db.samplingUnitProgress.where('projectId').equals(projectId).toArray();

        const exportData: ProjectExportData = {
            version: 1,
            timestamp: Date.now(),
            project,
            modules,
            plots,
            treeObservations,
            vegetationObservations,
            samplingUnitProgress
        };

        const json = JSON.stringify(exportData, null, 2);
        return new Blob([json], { type: 'application/json' });
    });
};

export const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};
