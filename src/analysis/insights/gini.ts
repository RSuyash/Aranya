
export interface GiniRange {
    min: number;
    max: number;
    label: string;
    description: string;
    color: string;
}

export const GINI_RANGES: GiniRange[] = [
    { min: 0, max: 0.2, label: 'Uniform', description: 'Plantation-like, similar sized trees', color: '#f2c94c' }, // Yellow/Orange
    { min: 0.2, max: 0.5, label: 'Moderate', description: 'Natural regeneration or mixed age', color: '#56ccf2' }, // Blue
    { min: 0.5, max: 1.0, label: 'Complex', description: 'Old growth, multi-layered canopy', color: '#52d273' }  // Green
];

export const getGiniInsight = (value: number) => {
    const range = GINI_RANGES.find(r => value >= r.min && value < r.max) || GINI_RANGES[GINI_RANGES.length - 1];
    return range;
};

export const getGiniColor = (value: number) => {
    return getGiniInsight(value).color;
};
