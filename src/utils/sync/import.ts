import { db } from '../../core/data-model/dexie';
import type { ProjectExportData } from './export';
import { v4 as uuidv4 } from 'uuid';
// [THORNE] Added Dynamic Generator Import
import { generateLayout } from '../../core/plot-engine/generateLayout';
import { generateDynamicLayout } from '../../core/plot-engine/dynamicGenerator';
import { BlueprintRegistry, STD_10x10_QUADRANTS } from '../../core/plot-engine/blueprints';
import type { PlotNodeInstance } from '../../core/plot-engine/types';
import type { Plot } from '../../core/data-model/types';

// Helper to parse file without saving immediately
export const parseImportFile = async (file: File): Promise<ProjectExportData> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const json = e.target?.result as string;
                const data: ProjectExportData = JSON.parse(json);
                if (!data.version || !data.project || !data.project.id) {
                    throw new Error('Invalid Project File Format');
                }
                resolve(data);
            } catch (error) {
                reject(error);
            }
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsText(file);
    });
};

// Helper to check if project exists
export const checkProjectExists = async (projectId: string): Promise<boolean> => {
    const count = await db.projects.where('id').equals(projectId).count();
    return count > 0;
};

/**
 * The Core Import Logic
 * @param data The raw export data
 * @param mode 'REPLACE': Overwrite existing IDs. 'CREATE_NEW': Generate fresh IDs for everything.
 */
export const commitImport = async (data: ProjectExportData, mode: 'REPLACE' | 'CREATE_NEW') => {
    const now = Date.now();

    if (mode === 'REPLACE') {
        // Simple bulk put - Dexie handles overwrite
        await db.transaction('rw', [
            db.projects, db.modules, db.plots, db.treeObservations,
            db.vegetationObservations, db.samplingUnits
        ], async () => {
            await db.projects.put(data.project);
            if (data.modules?.length) await db.modules.bulkPut(data.modules);
            if (data.plots?.length) await db.plots.bulkPut(data.plots);
            if (data.treeObservations?.length) await db.treeObservations.bulkPut(data.treeObservations);
            if (data.vegetationObservations?.length) await db.vegetationObservations.bulkPut(data.vegetationObservations);
            if (data.samplingUnitProgress?.length) await db.samplingUnits.bulkPut(data.samplingUnitProgress);
        });
        return data.project.id;
    }

    // --- CREATE NEW MODE (Deep Clone) ---
    if (mode === 'CREATE_NEW') {
        // 1. Generate New Project ID
        const newProjectId = uuidv4();

        // Maps to track ID changes
        const moduleMap = new Map<string, string>(); // Old -> New
        const plotMap = new Map<string, string>();   // Old -> New
        const unitMap = new Map<string, string>();   // Old -> New (Critical for Visualizer)

        // 2. Clone Project
        const newProject = {
            ...data.project,
            id: newProjectId,
            name: `${data.project.name} (Imported)`,
            createdAt: now,
            updatedAt: now,
            syncStatus: 'LOCAL_ONLY' as const
        };

        // 3. Clone Modules
        const newModules = data.modules.map(m => {
            const newId = uuidv4();
            moduleMap.set(m.id, newId);
            return {
                ...m,
                id: newId,
                projectId: newProjectId,
                createdAt: now,
                updatedAt: now
            };
        });

        // 4. Clone Plots & Remap Sampling Units
        const newPlots: Plot[] = [];

        for (const p of data.plots) {
            const newPlotId = uuidv4();
            plotMap.set(p.id, newPlotId);

            // CRITICAL: Re-calculate Sampling Unit IDs
            // The visualizer relies on stable IDs generated from (Blueprint + PlotID).
            // Since PlotID changed, we must map Old_SU_ID -> Path -> New_SU_ID.

            // [THORNE FIX] Handle Dynamic Layouts vs Static Blueprints
            let oldLayout: PlotNodeInstance;
            let newLayout: PlotNodeInstance;

            if (p.blueprintId === 'dynamic' && p.configuration) {
                // Case A: Custom Plot
                oldLayout = generateDynamicLayout(p.configuration, p.id);
                newLayout = generateDynamicLayout(p.configuration, newPlotId);
            } else {
                // Case B: Standard Blueprint
                const blueprint = BlueprintRegistry.get(p.blueprintId) || STD_10x10_QUADRANTS;
                oldLayout = generateLayout(blueprint, undefined, p.id);
                newLayout = generateLayout(blueprint, undefined, newPlotId);
            }

            // Traverse both trees simultaneously to map IDs
            const mapNodes = (oldNode: PlotNodeInstance, newNode: PlotNodeInstance) => {
                if (oldNode.type === 'SAMPLING_UNIT') {
                    unitMap.set(oldNode.id, newNode.id);
                }
                for (let i = 0; i < oldNode.children.length; i++) {
                    if (newNode.children[i]) {
                        mapNodes(oldNode.children[i], newNode.children[i]);
                    }
                }
            };
            mapNodes(oldLayout, newLayout);

            newPlots.push({
                ...p,
                id: newPlotId,
                projectId: newProjectId,
                moduleId: moduleMap.get(p.moduleId) || p.moduleId,
                createdAt: now,
                updatedAt: now,
                syncStatus: 'LOCAL_ONLY' as const
            });
        }

        // 5. Clone Observations & Progress (Using the maps)
        const newTrees = data.treeObservations.map(t => ({
            ...t,
            id: uuidv4(),
            projectId: newProjectId,
            moduleId: moduleMap.get(t.moduleId)!,
            plotId: plotMap.get(t.plotId)!,
            samplingUnitId: unitMap.get(t.samplingUnitId) || t.samplingUnitId, // Remap SU ID
            createdAt: now,
            updatedAt: now,
            syncStatus: 'LOCAL_ONLY' as const
        }));

        const newVeg = data.vegetationObservations.map(v => ({
            ...v,
            id: uuidv4(),
            projectId: newProjectId,
            moduleId: moduleMap.get(v.moduleId)!,
            plotId: plotMap.get(v.plotId)!,
            samplingUnitId: unitMap.get(v.samplingUnitId) || v.samplingUnitId,
            createdAt: now,
            updatedAt: now,
            syncStatus: 'LOCAL_ONLY' as const
        }));

        const newProgress = data.samplingUnitProgress.map(sp => ({
            ...sp,
            id: uuidv4(),
            projectId: newProjectId,
            moduleId: moduleMap.get(sp.moduleId)!,
            plotId: plotMap.get(sp.plotId)!,
            samplingUnitId: unitMap.get(sp.samplingUnitId) || sp.samplingUnitId,
            createdAt: now,
            lastUpdatedAt: now
        }));

        // 6. Bulk Insert
        await db.transaction('rw', [
            db.projects, db.modules, db.plots, db.treeObservations,
            db.vegetationObservations, db.samplingUnits
        ], async () => {
            await db.projects.add(newProject);
            if (newModules.length) await db.modules.bulkAdd(newModules);
            if (newPlots.length) await db.plots.bulkAdd(newPlots);
            if (newTrees.length) await db.treeObservations.bulkAdd(newTrees);
            if (newVeg.length) await db.vegetationObservations.bulkAdd(newVeg);
            if (newProgress.length) await db.samplingUnits.bulkAdd(newProgress);
        });

        return newProjectId;
    }

    return '';
};