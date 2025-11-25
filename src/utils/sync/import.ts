import { db } from '../../db/db';
import type { ProjectExportData } from './export';

export const importProject = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = async (e) => {
            try {
                const json = e.target?.result as string;
                const data: ProjectExportData = JSON.parse(json);

                // Basic Validation
                if (!data.version || !data.project || !data.project.id) {
                    throw new Error('Invalid Project File Format');
                }

                // Check if project exists
                const existingProject = await db.projects.get(data.project.id);
                if (existingProject) {
                    // TODO: Handle conflict strategy (Overwrite vs Skip vs Clone)
                    // For now, we will OVERWRITE for simplicity in this phase
                    console.warn(`Project ${data.project.id} exists. Overwriting...`);
                }

                await db.transaction('rw', [
                    db.projects,
                    db.modules,
                    db.plots,
                    db.treeObservations,
                    db.vegetationObservations,
                    db.samplingUnitProgress
                ], async () => {
                    // 1. Project
                    await db.projects.put(data.project);

                    // 2. Modules
                    if (data.modules?.length) {
                        await db.modules.bulkPut(data.modules);
                    }

                    // 3. Plots
                    if (data.plots?.length) {
                        await db.plots.bulkPut(data.plots);
                    }

                    // 4. Tree Observations
                    if (data.treeObservations?.length) {
                        await db.treeObservations.bulkPut(data.treeObservations);
                    }

                    // 5. Vegetation Observations
                    if (data.vegetationObservations?.length) {
                        await db.vegetationObservations.bulkPut(data.vegetationObservations);
                    }

                    // 6. Progress
                    if (data.samplingUnitProgress?.length) {
                        await db.samplingUnitProgress.bulkPut(data.samplingUnitProgress);
                    }
                });

                resolve(data.project.id);

            } catch (error) {
                console.error('Import Failed:', error);
                reject(error);
            }
        };

        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsText(file);
    });
};
