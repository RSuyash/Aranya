import { v4 as uuidv4 } from 'uuid';
import { db } from '../../core/data-model/dexie';
import type { InterchangeProject } from './interchangeSchema';
import { PLOT_TEMPLATES } from '../../ui/modules/Vegetation/data/plotTemplates';

interface ImportContext {
    targetProjectId: string | 'NEW'; // 'NEW' or UUID
    newProjectName?: string;
    selectedBlueprintId: string;
    currentUserId: string;
}

export class ImportWizardController {

    async runImport(data: InterchangeProject, context: ImportContext): Promise<{ plots: number, trees: number }> {
        let importedPlots = 0;
        let importedTrees = 0;
        const sysTime = Date.now();

        // WRAP IN TRANSACTION FOR SAFETY
        await db.transaction('rw', [db.projects, db.modules, db.plots, db.treeObservations, db.vegetationObservations], async () => {

            // 1. Resolve Project
            let projectId = context.targetProjectId;
            if (projectId === 'NEW') {
                projectId = uuidv4();
                await db.projects.add({
                    id: projectId,
                    name: context.newProjectName || data.projectName || "Imported Project",
                    ownerId: context.currentUserId,
                    ownerName: "Current User", // Placeholder
                    createdAt: sysTime,
                    updatedAt: sysTime,
                    syncStatus: 'LOCAL_ONLY',
                    collaborators: [],
                    description: "Imported via Data Wizard"
                });
            }

            // 2. Resolve Module (Vegetation)
            // Check if module exists, else create
            let module = await db.modules.where({ projectId, type: 'VEGETATION_PLOTS' }).first();
            if (!module) {
                module = {
                    id: uuidv4(),
                    projectId,
                    type: 'VEGETATION_PLOTS',
                    name: "Vegetation Survey",
                    status: 'ACTIVE',
                    createdAt: sysTime,
                    updatedAt: sysTime,
                    predefinedSpeciesList: [], // Ideally load a default list here
                    validationSettings: { mandatoryPhotos: false }, // Defaults
                    customPlotAttributes: []
                } as any;
                await db.modules.add(module!);
            }
            const moduleId = module!.id;
            const speciesList = module!.predefinedSpeciesList || [];

            // 3. Process Plots
            for (const plotData of data.plots) {
                // Idempotency: Check if plot code exists in this project
                let plot = await db.plots.where({ projectId }).filter(p => p.code === plotData.plotCode).first();

                // TEMPORAL INTEGRITY: Parse date or default to now
                let surveyDate = new Date().toISOString().split('T')[0];
                if (plotData.surveyDate) {
                    const parsed = new Date(plotData.surveyDate);
                    if (!isNaN(parsed.getTime())) surveyDate = parsed.toISOString().split('T')[0];
                }

                if (!plot) {
                    const plotId = uuidv4();
                    await db.plots.add({
                        id: plotId,
                        projectId,
                        moduleId,
                        blueprintId: context.selectedBlueprintId,
                        blueprintVersion: 1,
                        name: plotData.plotCode, // Default name to code
                        code: plotData.plotCode,
                        coordinates: {
                            lat: plotData.lat || 0,
                            lng: plotData.lng || 0,
                            accuracyM: 0,
                            timestamp: sysTime,
                            fixType: 'SINGLE'
                        },
                        status: 'COMPLETED',
                        surveyDate: surveyDate, // CRITICAL: Ecological Date
                        customAttributes: plotData.customAttributes || {}, // DATA PRESERVATION
                        createdAt: sysTime,
                        updatedAt: sysTime,
                        syncStatus: 'LOCAL_ONLY',
                        // Defaults
                        orientation: 0, slope: 0, aspect: 'N', habitatType: plotData.habitatType || 'Unknown', surveyors: [], images: []
                    });
                    plot = { id: plotId } as any;
                    importedPlots++;
                }

                // 4. Process Trees
                if (plotData.trees && plotData.trees.length > 0) {
                    const blueprint = PLOT_TEMPLATES.find(b => b.id === context.selectedBlueprintId);

                    const treesBatch = plotData.trees.map(treeData => {
                        // A. Map Subplot (e.g., "Q1" -> "su-uuid")
                        // Naive mapping: based on grid configuration
                        let samplingUnitId = 'unknown';
                        if (blueprint) {
                            const normalizedInput = treeData.subplot.toLowerCase().replace(/[^a-z0-9]/g, '');

                            // Generate unit IDs based on grid configuration
                            const { rows, cols, labelStyle } = blueprint.config.grid;

                            // Generate the expected labels based on label style
                            let possibleUnits: string[] = [];
                            if (labelStyle === 'Q1-Q4') {
                                // For Q1-Q4 style: generate labels like Q1, Q2, Q3, Q4
                                for (let r = 0; r < rows; r++) {
                                    for (let c = 0; c < cols; c++) {
                                        const unitNum = r * cols + c + 1;
                                        possibleUnits.push(`q${unitNum}`); // lowercase for comparison
                                    }
                                }
                            } else if (labelStyle === 'Alpha') {
                                // For Alpha style: A, B, C, etc.
                                for (let i = 0; i < rows * cols; i++) {
                                    possibleUnits.push(String.fromCharCode(65 + i).toLowerCase()); // A=65 in ASCII
                                }
                            } else if (labelStyle === 'Matrix') {
                                // For Matrix style: 1-1, 1-2, etc.
                                for (let r = 0; r < rows; r++) {
                                    for (let c = 0; c < cols; c++) {
                                        possibleUnits.push(`${r + 1}-${c + 1}`.replace(/-/g, '')); // 11, 12, etc. for comparison
                                    }
                                }
                            }

                            // Check if the normalized input matches any of the possible units
                            if (possibleUnits.includes(normalizedInput)) {
                                samplingUnitId = normalizedInput;
                            }
                        }

                        // B. Taxonomy Reconciliation
                        let speciesName = 'Unknown';
                        let commonName = treeData.species;
                        let isUnknown = true;
                        let validationStatus: any = 'PENDING';

                        // Simple exact match logic (expand to fuzzy later)
                        const match = speciesList.find(s =>
                            s.scientificName.toLowerCase() === treeData.species.toLowerCase() ||
                            s.commonName.toLowerCase() === treeData.species.toLowerCase()
                        );

                        if (match) {
                            speciesName = match.scientificName;
                            commonName = match.commonName;
                            isUnknown = false;
                            validationStatus = 'VERIFIED';
                        }

                        // C. Create Observation
                        return {
                            id: uuidv4(),
                            projectId,
                            moduleId,
                            plotId: plot!.id,
                            samplingUnitId,
                            tagNumber: treeData.tag,
                            speciesName,
                            commonName,
                            isUnknown,
                            gbh: treeData.gbh || 0,
                            height: treeData.height || 0,
                            condition: (treeData.condition || 'Alive').toUpperCase(),
                            validationStatus,
                            syncStatus: 'LOCAL_ONLY',
                            createdAt: sysTime,
                            updatedAt: sysTime,
                            stemCount: 1, // Default
                            images: [],
                            // Data Preservation
                            ...treeData.customAttributes
                        };
                    });

                    await db.treeObservations.bulkAdd(treesBatch as any);
                    importedTrees += treesBatch.length;
                }
            }
        });

        return { plots: importedPlots, trees: importedTrees };
    }
}
