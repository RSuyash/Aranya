import JSZip from 'jszip';
import type { ProjectExportData } from './export';

/**
 * Intelligent file parser that handles .terx, .fldx (ZIP) and .json
 */
export const parseUniversalImport = async (file: File): Promise<ProjectExportData> => {
    const fileName = file.name.toLowerCase();
    console.log(`Attempting to parse file: ${fileName}, size: ${file.size} bytes, type: ${file.type}`);

    // STRATEGY 1: .terx, .fldx or .zip (Container Format)
    if (fileName.endsWith('.terx') || fileName.endsWith('.fldx') || fileName.endsWith('.zip')) {
        console.log(`Processing ${fileName} as ZIP archive`);
        try {
            const zip = await JSZip.loadAsync(file);

            // Look for the system state file
            const stateFile = zip.file("system_restore_state.json");
            if (!stateFile) {
                console.error(`Invalid Terra File: Missing system_restore_state.json in ${fileName}`);
                throw new Error("Invalid Terra File: Missing system_restore_state.json");
            }

            const jsonStr = await stateFile.async("string");
            const snapshot = JSON.parse(jsonStr);

            // Normalize structure if needed (handle v1 vs v2)
            // Assuming snapshot follows ProjectExportData structure or has a 'data' property
            if (snapshot.data && snapshot.meta) {
                console.log(`Successfully parsed ${fileName} - found ${Object.keys(snapshot.data).length} data sections`);
                return snapshot.data as ProjectExportData;
            }
            console.log(`Successfully parsed ${fileName} - direct snapshot format`);
            return snapshot as ProjectExportData;
        } catch (error) {
            console.error(`Error processing ZIP file ${fileName}:`, error);
            throw new Error(`Error processing ZIP file: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    // STRATEGY 2: .json (Raw Dump)
    else if (fileName.endsWith('.json')) {
        console.log(`Processing ${fileName} as JSON`);
        const text = await file.text();
        const result = JSON.parse(text) as ProjectExportData;
        console.log(`Successfully parsed ${fileName} as JSON`);
        return result;
    }

    console.warn(`Unsupported file type for ${fileName}. Expected .terx, .fldx, .zip, or .json`);
    throw new Error("Unsupported file type");
};
