import { db } from './dexie';
import { STD_10x10_QUADRANTS } from '../plot-engine/blueprints';
import { generateLayout } from '../plot-engine/generateLayout';
import { v4 as uuidv4 } from 'uuid';

/**
 * Seeds an "Analysis Test" project with realistic data for testing:
 * - Multiple plots (5) with diverse species distribution
 * - Varying abundance to test diversity indices
 * - Different GBH values for IVI calculations
 * - Species accumulation across plots for SAC
 */
export async function seedAnalysisTestProject() {
    console.log('🌱 Starting Analysis Test Project seeding...');

    const now = Date.now();
    const projectId = uuidv4();
    const moduleId = uuidv4();

    // Species pool with varying abundances across plots
    const speciesPool = [
        { name: 'Tectona grandis', common: 'Teak', rarity: 'common' },
        { name: 'Terminalia arjuna', common: 'Arjun', rarity: 'common' },
        { name: 'Azadirachta indica', common: 'Neem', rarity: 'frequent' },
        { name: 'Ficus benghalensis', common: 'Banyan', rarity: 'frequent' },
        { name: 'Dalbergia sissoo', common: 'Shisham', rarity: 'moderate' },
        { name: 'Shorea robusta', common: 'Sal', rarity: 'moderate' },
        { name: 'Mangifera indica', common: 'Mango', rarity: 'rare' },
        { name: 'Butea monosperma', common: 'Flame of Forest', rarity: 'rare' },
    ];

    // 1. Create Project
    await db.projects.add({
        id: projectId,
        name: 'Analysis Test Survey',
        description: 'Test data for ecological analysis algorithms (Shannon, Simpson, SAC, IVI)',
        ownerId: 'test-user',
        ownerName: 'Test Ecologist',
        collaborators: [],
        createdAt: now,
        updatedAt: now,
        syncStatus: 'LOCAL_ONLY',
    });

    console.log('✅ Project created:', projectId);

    // 2. Create Module
    await db.modules.add({
        id: moduleId,
        projectId,
        type: 'VEGETATION_PLOTS',
        name: 'Analysis Test Module',
        status: 'ACTIVE',
        samplingMethod: 'SYSTEMATIC',
        protocolVersion: 1,
        predefinedSpeciesList: speciesPool.map((s, idx) => ({
            id: `SP${String(idx + 1).padStart(3, '0')}`,
            scientificName: s.name,
            commonName: s.common,
            type: 'TREE',
        })),
        strataRules: {},
        validationSettings: { mandatoryPhotos: false },
        customPlotAttributes: [],
        defaultBlueprintId: STD_10x10_QUADRANTS.id,
        defaultBlueprintVersion: STD_10x10_QUADRANTS.version,
        createdAt: now,
        updatedAt: now,
    });

    console.log('✅ Module created:', moduleId);

    // 3. Create 5 plots with increasing species diversity
    const plotCount = 5;
    const plotIds: string[] = [];

    for (let plotNum = 1; plotNum <= plotCount; plotNum++) {
        const plotId = uuidv4();
        plotIds.push(plotId);

        const blueprint = STD_10x10_QUADRANTS;
        const rootInstance = generateLayout(blueprint, {}, plotId);

        // Get sampling units
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
            name: `Test Plot ${plotNum}`,
            code: `TP${plotNum}`,
            coordinates: {
                lat: 18.5204 + (Math.random() * 0.02),
                lng: 73.8567 + (Math.random() * 0.02),
                accuracyM: 5,
                fixType: 'SINGLE'
            },
            orientation: 0,
            slope: Math.round(Math.random() * 15),
            aspect: ['N', 'NE', 'E', 'SE', 'S'][plotNum % 5],
            habitatType: 'Mixed Deciduous Forest',
            status: 'COMPLETED',
            surveyors: ['Test Ecologist'],
            surveyDate: new Date().toISOString().split('T')[0],
            customAttributes: {},
            images: [],
            createdAt: now,
            updatedAt: now,
            syncStatus: 'LOCAL_ONLY',
        });

        // Add sampling unit progress
        for (const suId of samplingUnits) {
            await db.samplingUnits.add({
                id: uuidv4(),
                projectId,
                moduleId,
                plotId,
                samplingUnitId: suId,
                status: 'DONE',
                createdAt: now,
                lastUpdatedAt: now,
            });
        }

        // Add trees based on plot number to create species accumulation
        const treesData = generateTreesForPlot(plotNum, speciesPool, samplingUnits);

        console.log(`📊 Plot ${plotNum}: Adding ${treesData.length} trees across ${new Set(treesData.map(t => t.species)).size} species`);

        for (const tree of treesData) {
            await db.treeObservations.add({
                id: uuidv4(),
                projectId,
                moduleId,
                plotId,
                samplingUnitId: tree.suId,
                tagNumber: tree.tag,
                speciesName: tree.species,
                isUnknown: false,
                confidenceLevel: 'HIGH',
                gbh: tree.gbh,
                stemCount: 1,
                condition: 'ALIVE',
                phenology: tree.phenology as 'VEGETATIVE' | 'FLOWERING' | 'FRUITING',
                images: [],
                validationStatus: 'PENDING',
                createdAt: now,
                updatedAt: now,
                syncStatus: 'LOCAL_ONLY',
            });
        }
    }

    console.log('✅ All 5 plots created with trees');
    console.log('🎯 Analysis Test Project seeding complete!');
    console.log(`   Project ID: ${projectId}`);
    console.log(`   Navigate to: /projects/${projectId}/analysis`);
}

/**
 * Generate trees for a specific plot with realistic distribution
 * - Plot 1: 2 common species (low diversity, high evenness)
 * - Plot 2: Adds 1 more species
 * - Plot 3: Adds 2 more species
 * - Plot 4: Adds 1 more species
 * - Plot 5: Adds final 2 rare species (maximum diversity)
 */
function generateTreesForPlot(plotNum: number, _speciesPool: any[], samplingUnits: string[]) {
    const trees: Array<{ tag: string; species: string; gbh: number; suId: string; phenology: string }> = [];
    let tagCounter = 1;

    const phenologies = ['FLOWERING', 'VEGETATIVE', 'FRUITING', 'VEGETATIVE'];

    /*
     * Expected species by plot (for documentation):
     * 1: ['Tectona grandis', 'Terminalia arjuna'],
     * 2: ['Tectona grandis', 'Terminalia arjuna', 'Azadirachta indica'],
     * 3: ['Tectona grandis', 'Terminalia arjuna', 'Azadirachta indica', 'Ficus benghalensis', 'Dalbergia sissoo'],
     * 4: ['Tectona grandis', 'Terminalia arjuna', 'Azadirachta indica', 'Ficus benghalensis', 'Dalbergia sissoo', 'Shorea robusta'],
     * 5: ['Tectona grandis', 'Terminalia arjuna', 'Azadirachta indica', 'Ficus benghalensis', 'Dalbergia sissoo', 'Shorea robusta', 'Mangifera indica', 'Butea monosperma'],
     */

    // Distribution patterns by plot (manually defined for now)
    const distributions: { [key: number]: { [species: string]: number } } = {
        1: { 'Tectona grandis': 8, 'Terminalia arjuna': 7 }, // High abundance, low diversity
        2: { 'Tectona grandis': 6, 'Terminalia arjuna': 5, 'Azadirachta indica': 4 },
        3: { 'Tectona grandis': 5, 'Terminalia arjuna': 4, 'Azadirachta indica': 4, 'Ficus benghalensis': 3, 'Dalbergia sissoo': 2 },
        4: { 'Tectona grandis': 4, 'Terminalia arjuna': 3, 'Azadirachta indica': 3, 'Ficus benghalensis': 3, 'Dalbergia sissoo': 2, 'Shorea robusta': 2 },
        5: { 'Tectona grandis': 3, 'Terminalia arjuna': 3, 'Azadirachta indica': 2, 'Ficus benghalensis': 2, 'Dalbergia sissoo': 2, 'Shorea robusta': 2, 'Mangifera indica': 1, 'Butea monosperma': 1 },
    };

    const distribution = distributions[plotNum];

    // Generate trees
    Object.entries(distribution).forEach(([species, count]) => {
        for (let i = 0; i < count; i++) {
            const suIdx = Math.floor(Math.random() * samplingUnits.length);
            trees.push({
                tag: `P${plotNum}-T${String(tagCounter).padStart(3, '0')}`,
                species,
                gbh: 30 + Math.round(Math.random() * 60), // 30-90 cm GBH
                suId: samplingUnits[suIdx],
                phenology: phenologies[Math.floor(Math.random() * phenologies.length)],
            });
            tagCounter++;
        }
    });

    return trees;
}
