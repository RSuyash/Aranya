import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { db } from '../../core/data-model/dexie';
import type { Plot, VegetationModule } from '../../core/data-model/types';
import { BlueprintRegistry } from '../../core/plot-engine/blueprints';
import { generateLayout } from '../../core/plot-engine/generateLayout';
import { generateDynamicLayout } from '../../core/plot-engine/dynamicGenerator';

// Helper: Clean CSV String
function toCSV(data: any[]): string {
    if (!data.length) return '';
    const headers = Object.keys(data[0]);
    const csvRows = [
        headers.join(','),
        ...data.map(row => headers.map(fieldName => {
            const val = row[fieldName];
            if (val === null || val === undefined) return '';
            const str = String(val);
            // Excel-compatible quoting
            return str.includes(',') || str.includes('\n') || str.includes('"')
                ? `"${str.replace(/"/g, '""')}"`
                : str;
        }).join(','))
    ];
    return csvRows.join('\n');
}

// Helper: Generate GeoJSON for Plots
function toGeoJSON(plots: Plot[]) {
    return {
        type: "FeatureCollection",
        features: plots.map(p => ({
            type: "Feature",
            geometry: {
                type: "Point",
                coordinates: [p.coordinates.lng, p.coordinates.lat, p.coordinates.altitude || 0]
            },
            properties: {
                plot_id: p.id,
                name: p.name,
                code: p.code,
                survey_date: p.surveyDate,
                habitat: p.habitatType
            }
        }))
    };
}

export async function generateAnalystBundle(projectId: string) {
    console.log(`📦 Starting Scientific Bundle generation for ${projectId}`);
    const zip = new JSZip();

    // 1. Fetch Context
    const project = await db.projects.get(projectId);
    if (!project) throw new Error("Project not found");

    const modules = await db.modules.where('projectId').equals(projectId).toArray() as VegetationModule[];
    const plots = await db.plots.where('projectId').equals(projectId).toArray();
    const trees = await db.treeObservations.where('projectId').equals(projectId).toArray();
    const veg = await db.vegetationObservations.where('projectId').equals(projectId).toArray();
    const progress = await db.samplingUnits.where('projectId').equals(projectId).toArray();

    // ---------------------------------------------------------
    // 2. DATA TABLES (Relational Schema)
    // ---------------------------------------------------------

    // A. PLOTS
    const plotsData = plots.map(p => ({
        plot_id: p.id,
        code: p.code,
        name: p.name,
        latitude: p.coordinates.lat,
        longitude: p.coordinates.lng,
        accuracy_m: p.coordinates.accuracyM,
        elevation_m: p.coordinates.altitude,
        slope_deg: p.slope,
        aspect: p.aspect,
        habitat: p.habitatType,
        dimensions_desc: p.configuration
            ? `${p.configuration.dimensions.width}x${p.configuration.dimensions.length}m`
            : 'Legacy',
        survey_date: p.surveyDate,
        surveyors: p.surveyors.join('; ')
    }));
    zip.file('data/plots.csv', toCSV(plotsData));

    // B. SAMPLING UNITS (The Sample Frame)
    // We need to reconstruct the layout to get dimensions for each unit ID
    const samplingUnitsData: any[] = [];
    plots.forEach(plot => {
        let root;
        if (plot.configuration) {
            root = generateDynamicLayout(plot.configuration, plot.id);
        } else {
            const bp = BlueprintRegistry.get(plot.blueprintId);
            if (bp) root = generateLayout(bp, undefined, plot.id);
        }

        if (root) {
            const traverse = (node: any) => {
                if (node.type === 'SAMPLING_UNIT') {
                    // Find progress status
                    const prog = progress.find(p => p.samplingUnitId === node.id);

                    // Determine area
                    let areaM2 = 0;
                    if (node.shape.kind === 'RECTANGLE') areaM2 = node.shape.width * node.shape.length;
                    if (node.shape.kind === 'CIRCLE') areaM2 = Math.PI * Math.pow(node.shape.radius, 2);

                    samplingUnitsData.push({
                        unit_id: node.id,
                        plot_id: plot.id,
                        label: node.label,
                        type: node.role || 'UNKNOWN',
                        shape: node.shape.kind,
                        area_m2: areaM2.toFixed(2),
                        status: prog?.status || 'NOT_STARTED'
                    });
                }
                node.children?.forEach(traverse);
            };
            traverse(root);
        }
    });
    zip.file('data/sampling_units.csv', toCSV(samplingUnitsData));

    // C. TREES (Individuals)
    const treesData = trees.map(t => ({
        tree_id: t.id,
        plot_id: t.plotId,
        sampling_unit_id: t.samplingUnitId,
        tag_number: t.tagNumber,
        scientific_name: t.speciesName,
        common_name: t.commonName,
        is_unknown: t.isUnknown,
        confidence: t.confidenceLevel,
        // Metrics
        equivalent_gbh_cm: t.gbh, // Aggregated
        height_m: t.height,
        stem_count: t.stemCount,
        condition: t.condition,
        phenology: t.phenology,
        // Spatial
        relative_x_m: t.localX,
        relative_y_m: t.localY,
        validation_status: t.validationStatus,
        notes: t.remarks
    }));
    zip.file('data/trees.csv', toCSV(treesData));

    // D. STEMS (Raw Biometrics) - CRITICAL FOR BIOMASS
    const stemsData: any[] = [];
    trees.forEach(t => {
        if (t.stems && t.stems.length > 0) {
            t.stems.forEach((stem, idx) => {
                stemsData.push({
                    stem_id: stem.id,
                    tree_id: t.id,
                    stem_index: idx + 1,
                    gbh_cm: stem.gbh
                });
            });
        } else if (t.gbh) {
            // Single stem fallback
            stemsData.push({
                stem_id: `${t.id}-main`,
                tree_id: t.id,
                stem_index: 1,
                gbh_cm: t.gbh
            });
        }
    });
    zip.file('data/stems.csv', toCSV(stemsData));

    // E. VEGETATION
    const vegData = veg.map(v => ({
        record_id: v.id,
        plot_id: v.plotId,
        sampling_unit_id: v.samplingUnitId,
        growth_form: v.growthForm,
        scientific_name: v.speciesName,
        abundance: v.abundanceCount,
        cover_percent: v.coverPercentage,
        avg_height_cm: v.avgHeightCm,
        relative_x_m: v.localX,
        relative_y_m: v.localY
    }));
    zip.file('data/vegetation.csv', toCSV(vegData));

    // F. TAXONOMY (Master List)
    // Union of Predefined List + Observed Species
    const taxonomyMap = new Map<string, any>();

    // 1. Add Predefined
    modules.forEach(m => {
        m.predefinedSpeciesList?.forEach(s => {
            taxonomyMap.set(s.scientificName, { ...s, source: 'protocol_list' });
        });
    });

    // 2. Add Observed (if missing)
    const allObservations = [...trees, ...veg];
    allObservations.forEach(obs => {
        if (!taxonomyMap.has(obs.speciesName) && !obs.isUnknown) {
            taxonomyMap.set(obs.speciesName, {
                scientificName: obs.speciesName,
                commonName: '', // Unknown if not in master list
                type: 'OBSERVED',
                source: 'field_observation'
            });
        }
    });

    const taxonomyRows = Array.from(taxonomyMap.values()).map(s => ({
        scientific_name: s.scientificName,
        common_name: s.commonName,
        growth_form: s.type,
        source: s.source
    }));
    zip.file('data/taxonomy.csv', toCSV(taxonomyRows));

    // G. IMAGES LOG
    const imagesData: any[] = [];

    // Collect plot images
    plots.forEach(p => p.images?.forEach(img => imagesData.push({
        parent_type: 'PLOT', parent_id: p.id, image_type: img.type, url: img.url, timestamp: img.timestamp
    })));

    // Collect tree images
    trees.forEach(t => t.images?.forEach(img => imagesData.push({
        parent_type: 'TREE', parent_id: t.id, image_type: img.type, url: img.url, timestamp: t.updatedAt
    })));

    // Collect veg images
    veg.forEach(v => v.images?.forEach(img => imagesData.push({
        parent_type: 'VEG', parent_id: v.id, image_type: img.type || 'General', url: img.url, timestamp: v.updatedAt
    })));

    zip.file('data/images.csv', toCSV(imagesData));

    // ---------------------------------------------------------
    // 3. METADATA & SPATIAL
    // ---------------------------------------------------------

    const geoJson = toGeoJSON(plots);
    zip.file('spatial/plots.geojson', JSON.stringify(geoJson, null, 2));

    const metadata = {
        project: {
            name: project.name,
            id: project.id,
            exportDate: new Date().toISOString(),
            generator: "Terra Platform v1.0 (Scientific Bundle)"
        },
        stats: {
            plots: plots.length,
            trees: trees.length,
            stems: stemsData.length,
            vegetationRecords: veg.length,
            speciesCount: taxonomyMap.size
        },
        protocols: modules.map(m => ({
            name: m.name,
            method: m.samplingMethod,
            rules: m.strataRules,
            validation: m.validationSettings
        }))
    };
    zip.file('metadata.json', JSON.stringify(metadata, null, 2));

    const readme = `
PROJECT: ${project.name}
EXPORT DATE: ${new Date().toLocaleDateString()}

CONTENTS:
---------
1. /data/plots.csv          - Plot metadata (Location, Habitat, Topography)
2. /data/sampling_units.csv - Reference table for Subplots/Quadrants (Area, Dimensions)
3. /data/trees.csv          - Tree individuals (Aggregated metrics)
4. /data/stems.csv          - Raw stem measurements (Link via tree_id)
5. /data/vegetation.csv     - Non-tree strata records
6. /data/taxonomy.csv       - Master species list (Protocol + Observed)
7. /data/images.csv         - Registry of captured media
8. /spatial/plots.geojson   - GIS vector file (Points)

CITATION INFO:
--------------
Generated by Terra Platform. 
Coordinate System: WGS84 (EPSG:4326)
Biometrics: 
- GBH (Girth at Breast Height) in cm
- Height in meters
- Coordinates in meters relative to sampling unit origin (Bottom-Left 0,0)
    `.trim();
    zip.file('README.txt', readme);

    // 4. Finalize
    console.log("📦 Compressing bundle...");
    const blob = await zip.generateAsync({ type: 'blob' });
    const cleanName = project.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    saveAs(blob, `${cleanName}_analyst_bundle.zip`);
    console.log("✅ Bundle downloaded.");
}
