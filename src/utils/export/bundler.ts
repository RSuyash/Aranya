import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { generateTidyData } from './tidyDataExport';
import { db } from '../../core/data-model/dexie';

/**
 * Generates a "Terra Exchange" file (.fldx)
 * This is the native backup format containing both System State (JSON) and Analyst Data (CSV).
 */
export const exportTerraFile = async (projectId: string) => {
    const zip = new JSZip();
    const project = await db.projects.get(projectId);
    if (!project) throw new Error("Project not found");

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const safeName = project.name.replace(/[^a-z0-9]/gi, '_');

    // 1. Fetch ALL Data
    const [modules, plots, trees, veg, units] = await Promise.all([
        db.modules.where({ projectId }).toArray(),
        db.plots.where({ projectId }).toArray(),
        db.treeObservations.where({ projectId }).toArray(),
        db.vegetationObservations.where({ projectId }).toArray(),
        db.samplingUnits.where({ projectId }).toArray()
    ]);

    // 2. Create System Snapshot (The "Brain")
    // This JSON allows us to restore the project exactly as it was.
    const systemState = {
        version: 2,
        meta: { type: 'TERRA_BACKUP', exportedAt: Date.now() },
        data: { project, modules, plots, treeObservations: trees, vegetationObservations: veg, samplingUnits: units }
    };
    zip.file("system_restore_state.json", JSON.stringify(systemState, null, 2));

    // 3. Create Analyst Data (The "Body")
    // Included in .fldx so one file serves both purposes if needed
    const tidyData = generateTidyData({ project, plots, trees, vegetation: veg });
    const dataFolder = zip.folder("analyst_data");
    if (dataFolder) {
        dataFolder.file("plots.csv", tidyData.plotsCSV);
        dataFolder.file("trees.csv", tidyData.treesCSV);
        dataFolder.file("vegetation.csv", tidyData.vegetationCSV);
    }

    // 4. Generate and Save as .fldx
    const content = await zip.generateAsync({ type: "blob" });
    // The magic happens here: Custom Extension
    saveAs(content, `${safeName}_${timestamp}.fldx`);
};

/**
 * Generates an "Analyst Bundle" (.zip)
 * Focused on CSVs and clean folder structures for R/Python users.
 */
export const exportAnalystZip = async (projectId: string) => {
    const zip = new JSZip();
    const project = await db.projects.get(projectId);
    if (!project) throw new Error("Project not found");

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const safeName = project.name.replace(/[^a-z0-9]/gi, '_');

    // Fetch Data needed for CSVs
    const [plots, trees, veg] = await Promise.all([
        db.plots.where({ projectId }).toArray(),
        db.treeObservations.where({ projectId }).toArray(),
        db.vegetationObservations.where({ projectId }).toArray()
    ]);

    const tidyData = generateTidyData({ project, plots, trees, vegetation: veg });

    // Add CSVs to root or folder
    zip.file("plots.csv", tidyData.plotsCSV);
    zip.file("trees.csv", tidyData.treesCSV);
    zip.file("vegetation.csv", tidyData.vegetationCSV);
    zip.file("readme.txt", "These files are optimized for R/Python analysis.");

    const content = await zip.generateAsync({ type: "blob" });
    saveAs(content, `${safeName}_AnalystPackage_${timestamp}.zip`);
};

// Alias for backward compatibility if needed, or just remove if unused
export const exportProjectBundle = exportTerraFile;

