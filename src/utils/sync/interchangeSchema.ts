export interface InterchangeProject {
    projectName: string;
    projectDescription?: string;
    importSource?: string;
    plots: InterchangePlot[];
}

export interface InterchangePlot {
    plotCode: string; // Natural Key
    plotName?: string;

    // Spatial & Temporal
    lat?: number;
    lng?: number;
    surveyDate?: string; // ISO Date String
    habitatType?: string;

    // Data Preservation
    customAttributes?: Record<string, any>;

    // Children
    trees?: InterchangeTree[];
    vegetation?: InterchangeVeg[];
}

export interface InterchangeTree {
    tag: string;
    subplot: string;

    species: string;
    gbh: number;
    height?: number;
    condition?: string;

    // Data Preservation
    customAttributes?: Record<string, any>;
}

export interface InterchangeVeg {
    // Placeholder for future vegetation support
    plotCode: string;
    customAttributes?: Record<string, any>;
}

export const MAPPING_TARGETS = {
    PLOT: [
        { key: 'plotCode', label: 'Plot Code (Required)' },
        { key: 'surveyDate', label: 'Survey Date' },
        { key: 'lat', label: 'Latitude' },
        { key: 'lng', label: 'Longitude' },
        { key: 'habitatType', label: 'Habitat Type' }
    ],
    TREE: [
        { key: 'tag', label: 'Tree Tag' },
        { key: 'subplot', label: 'Subplot / Quadrant' },
        { key: 'species', label: 'Species Name' },
        { key: 'gbh', label: 'GBH (cm)' },
        { key: 'height', label: 'Height (m)' },
        { key: 'condition', label: 'Condition' }
    ]
};
