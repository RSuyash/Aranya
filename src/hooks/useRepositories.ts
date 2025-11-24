import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { Project, Module, Plot, TreeObservation, SyncMeta } from '../db/schema';
import { v4 as uuidv4 } from 'uuid';

const createSyncMeta = (): SyncMeta => ({
  syncStatus: 'LOCAL_ONLY',
  lastModifiedAt: Date.now(),
  lastModifiedBy: 'device-id-placeholder', // TODO: Get from auth context
});

export const useRepositories = () => {
  // --- Projects ---
  const projects = useLiveQuery(() => db.projects.toArray()) || [];
  
  const addProject = async (name: string, description?: string) => {
    const id = uuidv4();
    await db.projects.add({
      id,
      name,
      description,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      sync: createSyncMeta(),
    });
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
    await db.plots.add({
      id,
      projectId,
      moduleId,
      name,
      dimensions: { width: 20, height: 20 },
      sync: createSyncMeta(),
    });
    return id;
  };

  // --- Trees ---
  const useTrees = (plotId?: string) => {
    return useLiveQuery(() => {
      if (!plotId) return [];
      return db.treeObservations.where('plotId').equals(plotId).toArray();
    }, [plotId]) || [];
  };

  const addTree = async (data: Omit<TreeObservation, 'id' | 'sync' | 'images'>) => {
    const id = uuidv4();
    await db.treeObservations.add({
      ...data,
      id,
      images: [],
      sync: createSyncMeta(),
    });
    return id;
  };

  return {
    projects,
    addProject,
    usePlots,
    addPlot,
    useTrees,
    addTree,
  };
};
