import { db } from '../../core/data-model/dexie';
import type { Plot, TreeObservation, SamplingUnitProgress } from '../../core/data-model/types';

export type MultiStemHandling = 'separate_rows' | 'aggregate';

interface TidyTreeRow {
    // Tree-level
    tree_id: string;
    tag_number: string;
    species_name: string;
    common_name: string;
    is_unknown: boolean;
    confidence_level: string;

    // Metrics (aggregate tree-level)
    equivalent_gbh_cm: number | null;
    height_m: number | null;
    crown_diameter_m: number | null;
    stem_count: number;

    // Individual Stem (for long format)
    stem_id: string | null;
    stem_gbh_cm: number | null;

    // Health & Phenology
    condition: string;
    phenology: string;

    // Spatial (within sampling unit)
    local_x_m: number | null;
    local_y_m: number | null;

    // Plot-level (denormalized - repeated for each tree/stem)
    plot_id: string;
    plot_name: string;
    plot_code: string;
    slope_deg: number;
    aspect: string;
    habitat_type: string;

    // GPS
    lat: number;
    lng: number;
    gps_accuracy_m: number;
    altitude_m: number | null;
    orientation_deg: number;

    // Survey Metadata
    survey_date: string;
    surveyors: string;

    // Ground Cover (plot-level)
    rock_percent: number | null;
    bare_soil_percent: number | null;
    litter_percent: number | null;
    vegetation_percent: number | null;

    // Disturbance
    disturbance_type: string | null;

    // Sampling Unit
    sampling_unit_id: string;
    unit_status: string;

    // Validation
    validation_status: string;
    remarks: string;
}

export async function exportTidyCSV(
    projectId: string,
    multiStemHandling: MultiStemHandling = 'separate_rows'
): Promise<Blob> {
    console.log(`🔬 [TidyExport] Starting export for project ${projectId} with ${multiStemHandling}`);

    // 1. Fetch all data in parallel
    const [trees, plots, units] = await Promise.all([
        db.treeObservations.where('projectId').equals(projectId).toArray(),
        db.plots.where('projectId').equals(projectId).toArray(),
        db.samplingUnits.where('projectId').equals(projectId).toArray(),
    ]);

    console.log(`  📊 Found ${trees.length} trees, ${plots.length} plots, ${units.length} sampling units`);

    // 2. Create lookup maps for O(1) access
    const plotMap = new Map(plots.map(p => [p.id, p]));
    const unitMap = new Map(units.map(u => [u.samplingUnitId, u]));

    // 3. Generate tidy rows
    const rows: TidyTreeRow[] = [];

    for (const tree of trees) {
        const plot = plotMap.get(tree.plotId);
        const unit = unitMap.get(tree.samplingUnitId);

        if (!plot) {
            console.warn(`  ⚠️  Skipping tree ${tree.id} - plot ${tree.plotId} not found`);
            continue;
        }

        if (multiStemHandling === 'separate_rows' && tree.stems && tree.stems.length > 0) {
            // Long format: One row per stem
            for (const stem of tree.stems) {
                rows.push(buildTidyRow(tree, plot, unit, stem));
            }
        } else {
            // Single-stem or aggregate: One row per tree
            rows.push(buildTidyRow(tree, plot, unit));
        }
    }

    console.log(`  ✅ Generated ${rows.length} tidy rows`);

    // 4. Convert to CSV
    return rowsToCSV(rows);
}

function buildTidyRow(
    tree: TreeObservation,
    plot: Plot,
    unit: SamplingUnitProgress | undefined,
    stem?: { id: string; gbh: number }
): TidyTreeRow {
    return {
        // Tree Identification
        tree_id: tree.id,
        tag_number: tree.tagNumber,
        species_name: tree.speciesName,
        common_name: tree.commonName || '',
        is_unknown: tree.isUnknown,
        confidence_level: tree.confidenceLevel,

        // Tree Metrics (aggregate level)
        equivalent_gbh_cm: tree.gbh || null,
        height_m: tree.height || null,
        crown_diameter_m: tree.crownDiameter || null,
        stem_count: tree.stemCount,

        // Individual Stem (if long format)
        stem_id: stem?.id || null,
        stem_gbh_cm: stem?.gbh || null,

        // Health
        condition: tree.condition,
        phenology: tree.phenology,

        // Spatial
        local_x_m: tree.localX || null,
        local_y_m: tree.localY || null,

        // Plot-level (denormalized)
        plot_id: plot.id,
        plot_name: plot.name,
        plot_code: plot.code,
        slope_deg: plot.slope,
        aspect: plot.aspect,
        habitat_type: plot.habitatType,

        // GPS
        lat: plot.coordinates.lat,
        lng: plot.coordinates.lng,
        gps_accuracy_m: plot.coordinates.accuracyM,
        altitude_m: plot.coordinates.altitude || null,
        orientation_deg: plot.orientation,

        // Survey
        survey_date: plot.surveyDate,
        surveyors: plot.surveyors.join('; '),

        // Ground Cover
        rock_percent: plot.groundCover?.rockPercent || null,
        bare_soil_percent: plot.groundCover?.bareSoilPercent || null,
        litter_percent: plot.groundCover?.litterPercent || null,
        vegetation_percent: plot.groundCover?.vegetationPercent || null,

        // Disturbance
        disturbance_type: plot.disturbanceType || null,

        // Sampling Unit
        sampling_unit_id: tree.samplingUnitId,
        unit_status: unit?.status || 'UNKNOWN',

        // Validation
        validation_status: tree.validationStatus,
        remarks: tree.remarks || '',
    };
}

function rowsToCSV(rows: TidyTreeRow[]): Blob {
    if (rows.length === 0) {
        console.warn('  ⚠️  No rows to export - returning empty CSV');
        return new Blob([''], { type: 'text/csv;charset=utf-8;' });
    }

    // Header row
    const headers = Object.keys(rows[0]) as (keyof TidyTreeRow)[];
    let csv = headers.join(',') + '\n';

    // Data rows
    for (const row of rows) {
        const values = headers.map(header => {
            const val = row[header];

            // Handle null/undefined
            if (val === null || val === undefined) return '';

            // Handle booleans
            if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';

            // Handle strings with commas or quotes
            if (typeof val === 'string') {
                if (val.includes(',') || val.includes('"') || val.includes('\n')) {
                    return `"${val.replace(/"/g, '""')}"`;
                }
                return val;
            }

            // Numbers
            return String(val);
        });

        csv += values.join(',') + '\n';
    }

    return new Blob([csv], { type: 'text/csv;charset=utf-8;' });
}
