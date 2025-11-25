import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../core/data-model/dexie';
import type { TreeObservation, Project, Plot, VegetationModule } from '../core/data-model/types';
import { v4 as uuidv4 } from 'uuid';

export const useRepositories = () => {
    // --- Projects ---
    const projects = useLiveQuery(() => db.projects.toArray()) || [];

    const addProject = async (name: string, description: string = '') => {
        const id = uuidv4();
        const newProject: Project = {
            id,
            name,
            description,
            ownerId: 'user-1', // Placeholder
            ownerName: 'Current User', // Placeholder
            collaborators: [],
            createdAt: Date.now(),
            updatedAt: Date.now(),
            syncStatus: 'LOCAL_ONLY',
        };
        await db.projects.add(newProject);
        return id;
    };

    // --- Plots ---
    const usePlots = (projectId?: string) => {
        return useLiveQuery(() => {
            if (!projectId) return [];
            return db.plots.where('projectId').equals(projectId).toArray();
        }, [projectId]) || [];
    };

    const addPlot = async (projectId: string, moduleId: string, name: string) => {
        const id = uuidv4();
        const newPlot: Plot = {
            id,
            projectId,
            moduleId,
            name,
            code: name.substring(0, 6).toUpperCase(), // Auto-generate code
            blueprintId: 'std-10x10-4q', // Default to 4-quadrant standard
            blueprintVersion: 1,
            coordinates: { lat: 0, lng: 0, accuracyM: 0 },
            orientation: 0,
            slope: 0,
            aspect: 'N',
            habitatType: 'General',
            images: [],
            status: 'PLANNED',
            surveyors: [],
            surveyDate: new Date().toISOString().split('T')[0],
            customAttributes: {},
            createdAt: Date.now(),
            updatedAt: Date.now(),
            syncStatus: 'LOCAL_ONLY',
        };
        await db.plots.add(newPlot);
        return id;
    };

    // --- Trees ---
    const useTrees = (plotId?: string) => {
        return useLiveQuery(() => {
            if (!plotId) return [];
            return db.treeObservations.where('plotId').equals(plotId).toArray();
        }, [plotId]) || [];
    };

    const addTree = async (data: Omit<TreeObservation, 'id' | 'syncStatus' | 'lastModifiedAt' | 'images' | 'createdAt' | 'updatedAt'>) => {
        const id = uuidv4();
        const newTree: TreeObservation = {
            ...data,
            id,
            images: [],
            validationStatus: data.validationStatus || 'PENDING',
            createdAt: Date.now(),
            updatedAt: Date.now(),
            syncStatus: 'LOCAL_ONLY',
        };
        await db.treeObservations.add(newTree);
        return id;
    };

    const useTreeObservations = (projectId?: string) => {
        return useLiveQuery(() => {
            if (!projectId) return [];
            return db.treeObservations.where('projectId').equals(projectId).toArray();
        }, [projectId]) || [];
    };

    // --- Modules ---
    const useModules = (projectId?: string) => {
        return useLiveQuery(() => {
            if (!projectId) return [];
            return db.modules.where('projectId').equals(projectId).toArray();
        }, [projectId]) || [];
    };

    const addVegetationModule = async (
        projectId: string,
        name: string,
        config?: Partial<VegetationModule>
    ) => {
        // Check for existing module of same type
        const existingModule = await db.modules
            .where('projectId')
            .equals(projectId)
            .filter(m => m.type === 'VEGETATION_PLOTS')
            .first();

        if (existingModule) {
            console.warn('Vegetation module already exists for this project');
            return existingModule.id;
        }

        const id = uuidv4();
        const now = Date.now();
        const module: VegetationModule = {
            id,
            projectId,
            type: 'VEGETATION_PLOTS',
            name,
            status: 'ACTIVE',
            samplingMethod: config?.samplingMethod || 'SYSTEMATIC',
            validationSettings: config?.validationSettings || { mandatoryPhotos: false },
            customPlotAttributes: config?.customPlotAttributes || [],
            createdAt: now,
            updatedAt: now,
            ...config,
        };
        await db.modules.add(module);
        return id;
    };

    return {
        projects,
        addProject,
        usePlots,
        addPlot,
        useTrees,
        useTreeObservations,
        addTree,
        useModules,
        addVegetationModule,
    };
};
