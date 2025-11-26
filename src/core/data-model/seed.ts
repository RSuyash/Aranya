import { db } from './dexie';
import { STD_10x10_QUADRANTS } from '../plot-engine/blueprints';
import { generateLayout } from '../plot-engine/generateLayout';
import { v4 as uuidv4 } from 'uuid';

export async function seedDemoProjectIfEmpty() {
    const count = await db.projects.count();
    if (count > 0) return;

    console.log('Seeding demo project...');

    const now = Date.now();
    const projectId = uuidv4();
    const moduleId = uuidv4();

    // 1. Project
    await db.projects.add({
        id: projectId,
        name: 'Demo Forest Survey',
        description: 'Demo data for Aranya dev',
        ownerId: 'demo-user',
        ownerName: 'Demo User',
        collaborators: [],
        createdAt: now,
        updatedAt: now,
        syncStatus: 'LOCAL_ONLY',
    });

    // 2. Module
    await db.modules.add({
        id: moduleId,
        projectId,
        type: 'VEGETATION_PLOTS',
        name: 'Vegetation Plots – Demo',
        status: 'ACTIVE',
        samplingMethod: 'SYSTEMATIC',
        protocolVersion: 1,
        predefinedSpeciesList: [
            { id: 'S001', scientificName: 'Tectona grandis', commonName: 'Teak', type: 'TREE' },
            { id: 'S002', scientificName: 'Terminalia arjuna', commonName: 'Arjun', type: 'TREE' },
            { id: 'S003', scientificName: 'Azadirachta indica', commonName: 'Neem', type: 'TREE' },
            { id: 'S004', scientificName: 'Ficus benghalensis', commonName: 'Banyan', type: 'TREE' },
        ],
        strataRules: {},
        validationSettings: { mandatoryPhotos: false },
        customPlotAttributes: [],
        defaultBlueprintId: STD_10x10_QUADRANTS.id,
        defaultBlueprintVersion: STD_10x10_QUADRANTS.version,
        createdAt: now,
        updatedAt: now,
    });

    // 3. Plots
    const plotCount = 5;
    for (let i = 1; i <= plotCount; i++) {
        const plotId = uuidv4();
        const blueprint = STD_10x10_QUADRANTS;

        // Generate layout to get sampling units
        const rootInstance = generateLayout(blueprint, {}, plotId);

        // Flatten sampling units to create progress records
        const samplingUnits: string[] = [];
        const traverse = (node: any) => {
            if (node.type === 'SAMPLING_UNIT') samplingUnits.push(node.id);
            node.children.forEach(traverse);
        };
        traverse(rootInstance);

        await db.plots.add({
            id: plotId,
            projectId,
            moduleId,
            blueprintId: blueprint.id,
            blueprintVersion: blueprint.version,
            name: `P-${100 + i}`,
            code: `P${100 + i}`,
            coordinates: {
                lat: 18.5204 + (Math.random() * 0.01),
                lng: 73.8567 + (Math.random() * 0.01),
                accuracyM: 5,
                fixType: 'SINGLE'
            },
            orientation: 0,
            slope: Math.round(Math.random() * 10),
            aspect: 'N',
            habitatType: 'Deciduous Forest',
            status: i === 1 ? 'IN_PROGRESS' : 'PLANNED',
            surveyors: ['Demo User'],
            surveyDate: new Date().toISOString().split('T')[0],
            customAttributes: {},
            images: [],
            createdAt: now,
            updatedAt: now,
            syncStatus: 'LOCAL_ONLY',
        });

        // Add Sampling Unit Progress
        for (const suId of samplingUnits) {
            await db.samplingUnits.add({
                id: uuidv4(),
                projectId,
                moduleId,
                plotId,
                samplingUnitId: suId,
                status: 'NOT_STARTED',
                createdAt: now,
                lastUpdatedAt: now,
            });
        }

        // Add some dummy trees to the first plot for visualization demo
        if (i === 1 && samplingUnits.length >= 4) {
            const demoTrees = [
                // Q1 - 3 trees
                { quadrant: 0, tag: 'T001', species: 'Tectona grandis', gbh: 45 },
                { quadrant: 0, tag: 'T002', species: 'Terminalia arjuna', gbh: 38 },
                { quadrant: 0, tag: 'T003', species: 'Azadirachta indica', gbh: 52 },
                // Q2 - 1 tree
                { quadrant: 1, tag: 'T004', species: 'Ficus benghalensis', gbh: 67 },
                // Q3 - 5 trees
                { quadrant: 2, tag: 'T005', species: 'Tectona grandis', gbh: 41 },
                { quadrant: 2, tag: 'T006', species: 'Tectona grandis', gbh: 39 },
                { quadrant: 2, tag: 'T007', species: 'Terminalia arjuna', gbh: 44 },
                { quadrant: 2, tag: 'T008', species: 'Azadirachta indica', gbh: 36 },
                { quadrant: 2, tag: 'T009', species: 'Ficus benghalensis', gbh: 71 },
                // Q4 - 2 trees
                { quadrant: 3, tag: 'T010', species: 'Terminalia arjuna', gbh: 48 },
                { quadrant: 3, tag: 'T011', species: 'Azadirachta indica', gbh: 42 },
            ];

            for (const tree of demoTrees) {
                await db.treeObservations.add({
                    id: uuidv4(),
                    projectId,
                    moduleId,
                    plotId,
                    samplingUnitId: samplingUnits[tree.quadrant],
                    tagNumber: tree.tag,
                    speciesName: tree.species,
                    isUnknown: false,
                    confidenceLevel: 'HIGH',
                    gbh: tree.gbh,
                    stemCount: 1,
                    condition: 'ALIVE',
                    phenology: 'VEGETATIVE',
                    images: [],
                    validationStatus: 'PENDING',
                    createdAt: now,
                    updatedAt: now,
                    syncStatus: 'LOCAL_ONLY',
                });
            }

            // Update sampling unit statuses for demo
            await db.samplingUnits.where({ plotId, samplingUnitId: samplingUnits[0] }).modify({ status: 'DONE' });
            await db.samplingUnits.where({ plotId, samplingUnitId: samplingUnits[1] }).modify({ status: 'DONE' });
            await db.samplingUnits.where({ plotId, samplingUnitId: samplingUnits[2] }).modify({ status: 'IN_PROGRESS' });
            await db.samplingUnits.where({ plotId, samplingUnitId: samplingUnits[3] }).modify({ status: 'IN_PROGRESS' });
        }
    }

    console.log('Seeding complete.');
}
