import type { VegetationModule } from '../../core/data-model/types';

export interface SpeciesEntry {
    id: string;
    scientificName: string;
    commonName: string;
    type: 'TREE' | 'SHRUB' | 'HERB' | 'ALL';
}

export async function parseSpeciesCSV(file: File): Promise<VegetationModule['predefinedSpeciesList']> {
    const text = await file.text();
    const lines = text.split('\n').slice(1); // Skip header

    return lines.map(line => {
        const [sci, com, type] = line.split(',').map(s => s.trim());
        if (!sci) return null;
        
        return {
            id: sci.toLowerCase().replace(/\s+/g, '-'),
            scientificName: sci,
            commonName: com || '',
            type: (['TREE', 'SHRUB', 'HERB'].includes(type?.toUpperCase()) ? type.toUpperCase() : 'ALL') as any
        };
    }).filter(Boolean) as VegetationModule['predefinedSpeciesList'];
}