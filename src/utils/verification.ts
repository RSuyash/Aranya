import { db } from '../core/data-model/dexie';
import { v4 as uuidv4 } from 'uuid';

export const verifyDatabaseIntegrity = async () => {
    console.group('🔍 Database Integrity Check');
    const results: string[] = [];

    try {
        // 1. Create Test Data
        const projectId = uuidv4();
        const plotId = uuidv4();
        const treeId = uuidv4();
        const timestamp = Date.now();

        console.log('1. Creating Test Data...');

        // Add Project
        await db.projects.add({
            id: projectId,
            name: `Test Project ${timestamp}`,
            description: 'Test Description',
            ownerId: 'test-user',
            ownerName: 'Test User',
            collaborators: [],
            createdAt: timestamp,
            updatedAt: timestamp,
            syncStatus: 'LOCAL_ONLY'
        });

        // Add Plot
        await db.plots.add({
            id: plotId,
            projectId: projectId,
            moduleId: 'vegetation',
            name: 'Test Plot P-001',
            code: 'P-001',
            blueprintId: 'std-10x10',
            blueprintVersion: 1,
            coordinates: { lat: 0, lng: 0, accuracyM: 0 },
            orientation: 0,
            slope: 0,
            aspect: 'N',
            habitatType: 'Test Habitat',
            images: [],
            status: 'PLANNED',
            surveyors: [],
            surveyDate: new Date().toISOString(),
            customAttributes: {},
            createdAt: timestamp,
            updatedAt: timestamp,
            syncStatus: 'LOCAL_ONLY',
            lastModifiedAt: timestamp
        });

        // Add Tree
        await db.treeObservations.add({
            id: treeId,
            projectId: projectId,
            moduleId: 'vegetation',
            plotId: plotId,
            samplingUnitId: 'q1', // Placeholder
            tagNumber: 'TEST-TREE-001',
            speciesName: 'Tectona grandis',
            isUnknown: false,
            confidenceLevel: 'HIGH',
            gbh: 150,
            stemCount: 1,
            condition: 'ALIVE',
            phenology: 'VEGETATIVE',
            images: [],
            validationStatus: 'PENDING',
            createdAt: timestamp,
            updatedAt: timestamp,
            syncStatus: 'LOCAL_ONLY',
            lastModifiedAt: timestamp
        });

        // 2. Verify Data Persistence
        console.log('2. Verifying Persistence...');

        const savedProject = await db.projects.get(projectId);
        const savedPlot = await db.plots.get(plotId);
        const savedTree = await db.treeObservations.get(treeId);

        if (savedProject?.id === projectId) results.push('✅ Project Saved');
        else results.push('❌ Project Failed');

        if (savedPlot?.projectId === projectId) results.push('✅ Plot Linked to Project');
        else results.push('❌ Plot Link Failed');

        if (savedTree?.plotId === plotId) results.push('✅ Tree Linked to Plot');
        else results.push('❌ Tree Link Failed');

        // 3. Cleanup
        console.log('3. Cleaning up...');
        await db.treeObservations.delete(treeId);
        await db.plots.delete(plotId);
        await db.projects.delete(projectId);
        results.push('✅ Cleanup Successful');

    } catch (error) {
        console.error('Verification Failed:', error);
        results.push(`❌ CRITICAL ERROR: ${error}`);
    }

    console.groupEnd();
    return results;
};

export const generateTestData = async () => {
    const projectId = uuidv4();
    const plotId = uuidv4();
    const treeId = uuidv4();
    const timestamp = Date.now();

    await db.transaction('rw', [db.projects, db.plots, db.treeObservations], async () => {
        // Add Project
        await db.projects.add({
            id: projectId,
            name: `Generated Project ${new Date().toLocaleTimeString()}`,
            description: 'Auto-generated test project for export verification.',
            ownerId: 'test-user',
            ownerName: 'Test User',
            collaborators: [],
            createdAt: timestamp,
            updatedAt: timestamp,
            syncStatus: 'LOCAL_ONLY'
        });

        // Add Plot
        await db.plots.add({
            id: plotId,
            projectId: projectId,
            moduleId: 'vegetation',
            name: 'Gen Plot A-1',
            code: 'GP-A1',
            blueprintId: 'std-10x10',
            blueprintVersion: 1,
            coordinates: { lat: 0, lng: 0, accuracyM: 0 },
            orientation: 0,
            slope: 0,
            aspect: 'N',
            habitatType: 'Generated Habitat',
            images: [],
            status: 'IN_PROGRESS',
            surveyors: [],
            surveyDate: new Date().toISOString(),
            customAttributes: {},
            createdAt: timestamp,
            updatedAt: timestamp,
            syncStatus: 'LOCAL_ONLY',
            lastModifiedAt: timestamp
        });

        // Add Tree
        await db.treeObservations.add({
            id: treeId,
            projectId: projectId,
            moduleId: 'vegetation',
            plotId: plotId,
            samplingUnitId: 'q1',
            tagNumber: 'GEN-TREE-001',
            speciesName: 'Mangifera indica',
            isUnknown: false,
            confidenceLevel: 'HIGH',
            gbh: 200,
            stemCount: 1,
            condition: 'ALIVE',
            phenology: 'FRUITING',
            images: [],
            validationStatus: 'VERIFIED',
            createdAt: timestamp,
            updatedAt: timestamp,
            syncStatus: 'LOCAL_ONLY',
            lastModifiedAt: timestamp
        });
    });

    return projectId;
};
