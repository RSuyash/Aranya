import JSZip from 'jszip';
import type { ProjectExportData } from './export';

/**
 * Intelligent file parser that handles .terx (ZIP) and .json
 */
export const parseUniversalImport = async (file: File): Promise<ProjectExportData> => {
    const fileName = file.name.toLowerCase();

    // STRATEGY 1: .terx or .zip (Container Format)
    if (fileName.endsWith('.terx') || fileName.endsWith('.zip')) {
        const zip = await JSZip.loadAsync(file);

        // Look for the system state file
        const stateFile = zip.file("system_restore_state.json");
        if (!stateFile) {
            throw new Error("Invalid Terra File: Missing system_restore_state.json");
        }

        const jsonStr = await stateFile.async("string");
        const snapshot = JSON.parse(jsonStr);

        // Normalize structure if needed (handle v1 vs v2)
        // Assuming snapshot follows ProjectExportData structure or has a 'data' property
        if (snapshot.data && snapshot.meta) {
            return snapshot.data as ProjectExportData;
        }
        return snapshot as ProjectExportData;
    }

    // STRATEGY 2: .json (Raw Dump)
    else if (fileName.endsWith('.json')) {
        const text = await file.text();
        return JSON.parse(text) as ProjectExportData;
    }

    throw new Error("Unsupported file type");
};
