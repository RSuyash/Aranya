/**
 * Simple CSV Parser & Mapper
 * Handles file reading and column heuristics.
 */

export interface CSVRow {
    [header: string]: string;
}

export const parseCSV = async (file: File): Promise<{ headers: string[], rows: CSVRow[] }> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target?.result as string;
            if (!text) return resolve({ headers: [], rows: [] });

            const lines = text.split(/\r\n|\n/).filter(line => line.trim() !== '');
            if (lines.length < 2) return resolve({ headers: [], rows: [] });

            // Naive split - in production, use a library if fields contain commas
            // For now, assuming standard scientific CSVs without quoted commas
            const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));

            const rows = lines.slice(1).map(line => {
                const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
                const row: CSVRow = {};
                headers.forEach((h, i) => {
                    row[h] = values[i] || '';
                });
                return row;
            });

            resolve({ headers, rows });
        };
        reader.onerror = () => reject(new Error("Failed to read file"));
        reader.readAsText(file);
    });
};

/**
 * Heuristic to guess which CSV column maps to which Schema field
 */
export const guessMapping = (headers: string[], targetField: string): string | null => {
    const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
    const target = normalize(targetField);

    // Common synonyms in ecological datasets
    const synonyms: Record<string, string[]> = {
        'plotCode': ['plot', 'plotid', 'plotno', 'plotcode', 'location', 'plot_id'],
        'surveyDate': ['date', 'surveydate', 'time', 'timestamp', 'survey_date'],
        'lat': ['lat', 'latitude', 'y'],
        'lng': ['lng', 'long', 'longitude', 'x'],
        'tag': ['tag', 'treeid', 'treeno', 'number', 'id', 'tree_tag', 'tag_no'],
        'subplot': ['quad', 'quadrant', 'sub', 'subplot', 'unit', 'quad_id'],
        'species': ['sp', 'species', 'scientificname', 'botanicalname', 'name', 'species_name'],
        'gbh': ['gbh', 'dbh', 'girth', 'circumference', 'gbh_cm'],
        'height': ['ht', 'height', 'hgt', 'height_m'],
    };

    // 1. Exact match
    if (headers.includes(targetField)) return targetField;

    // 2. Synonym match
    const synonymList = synonyms[targetField] || [];
    for (const header of headers) {
        if (synonymList.includes(normalize(header))) return header;
    }

    return null;
};
