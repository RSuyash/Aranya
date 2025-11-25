# Data Pipeline: Field-to-Lab Architecture (Draft 2)

**Status:** Draft 2 (Refined based on Audit)
**Objective:** Secure the "Output" phase of the data lifecycle by implementing a robust Serialization Layer that handles versioning, schema migration, and conflict resolution, delivering a "Publication-Ready" dataset.

## 1. Executive Summary
We are moving from a simple "dump" export to a **Multi-Format Data Pipeline**. This ensures compliance with scientific standards (e.g., Darwin Core, ForestPlots.net) and provides robust backup/restore capabilities.

## 2. The Three Tiers of Export

We will implement a strategy that serves three distinct user personas:

| Tier | Format | Persona | Use Case | Industry Standard |
| :--- | :--- | :--- | :--- | :--- |
| **Tier 1** | **JSON Archive** | SysAdmin / Backup | Full state restore, migration between tablets. | Redux / Dexie Dump |
| **Tier 2** | **Analyst Bundle (ZIP)** | R / Python Scientist | Relational CSVs + Metadata + GIS + Taxonomy. | Darwin Core Archive |
| **Tier 3** | **Geo-Spatial** | GeoJSON | Visualizing trees in QGIS / ArcGIS / Google Earth. | OGC GeoJSON |

## 3. The "Analyst Bundle" (Scientific Requirement)
A single CSV file is insufficient. The Analyst Bundle will be a `.zip` file containing:

*   **`data/plots.csv`**: Site-level metadata and geolocation.
*   **`data/trees.csv`**: Individual tree observations (GBH, Height, Local X/Y).
*   **`data/vegetation.csv`**: Non-tree vegetation data.
*   **`data/taxonomy.csv`**: **[UPDATED]** Union of predefined list AND observed species. Includes `source` column ("defined" vs "observed_custom").
*   **`spatial/plots.geojson`**: **[NEW]** FeatureCollection of plot centroids for GIS visualization.
*   **`metadata.json`**: **[NEW]** Machine-readable project settings and protocol summary (Sampling Method, Dimensions, Cutoffs).
*   **`README.txt`**: Human-readable file explaining units, surveyor names, and date.

## 4. The "Smart Import" (Engineering Challenge)
Importing data requires a robust Merge Strategy to handle conflicts and duplicates.

### Merge Strategy
1.  **UUID Match**: Check if `ProjectID` exists.
2.  **Timestamp Check**: If exists, is the Import `updatedAt` > Local `updatedAt`?

### Conflict Resolution UI
*   **Option A: "Fork"**: Import as a copy with new UUIDs.
*   **Option B: "Merge"**: Update existing records, add new ones.
*   **Option C: "Wipe & Replace"**: Dangerous, but necessary for restoring backups.

## 5. Implementation Roadmap

### Phase 1: The ZIP Engine (Client-Side)
*   **Dependencies**: `jszip`, `file-saver`.
*   **Task**: Create `src/utils/export/bundler.ts` with the robust logic below.
*   **Goal**: Generate the Analyst Bundle in the browser.

### Phase 2: The Data Transformers
*   **Task**: Implement strict transformers to map internal Dexie schema to "Publication Ready" column names.
*   **Mapping**:
    *   Internal: `localX`, `localY`
    *   Export: `relative_x_m`, `relative_y_m` (Explicit units are mandatory).

### Phase 3: The Import Wizard
*   **Task**: Build a UI flow that parses uploaded JSON/ZIP.
*   **Features**: Summary view ("Found 5 Plots, 230 Trees"), Merge Strategy selection.

## 6. Proposed Code Structure

### `src/utils/export/bundler.ts`

```typescript
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { db } from '../../core/data-model/dexie';
import type { TreeObservation, Plot, VegetationModule } from '../../core/data-model/types';

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
            return str.includes(',') || str.includes('\n') ? `"${str.replace(/"/g, '""')}"` : str;
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
                survey_date: p.surveyDate
            }
        }))
    };
}

export async function generateAnalystBundle(projectId: string) {
    console.log(`📦 Starting Analyst Bundle generation for ${projectId}`);
    const zip = new JSZip();

    // 1. Fetch All Data Context
    const project = await db.projects.get(projectId);
    if (!project) throw new Error("Project not found");

    const modules = await db.modules.where('projectId').equals(projectId).toArray() as VegetationModule[];
    const plots = await db.plots.where('projectId').equals(projectId).toArray();
    const trees = await db.treeObservations.where('projectId').equals(projectId).toArray();
    const veg = await db.vegetationObservations.where('projectId').equals(projectId).toArray();

    // 2. PLOTS.CSV (Site Data)
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
        dimensions: p.configuration 
            ? `${p.configuration.dimensions.width}x${p.configuration.dimensions.length}` 
            : 'Legacy',
        survey_date: p.surveyDate,
        surveyors: p.surveyors.join('; ')
    }));
    zip.file('data/plots.csv', toCSV(plotsData));

    // 3. TREES.CSV (Occurrence Data)
    const treesData = trees.map(t => ({
        occurrence_id: t.id,
        plot_id: t.plotId,
        sampling_unit_id: t.samplingUnitId,
        tag: t.tagNumber,
        scientific_name: t.speciesName,
        is_unknown: t.isUnknown,
        gbh_cm: t.gbh,
        height_m: t.height,
        stem_count: t.stemCount,
        condition: t.condition,
        phenology: t.phenology,
        local_x: t.localX,
        local_y: t.localY,
        validation_status: t.validationStatus
    }));
    zip.file('data/trees.csv', toCSV(treesData));

    // 4. VEGETATION.CSV
    const vegData = veg.map(v => ({
        observation_id: v.id,
        plot_id: v.plotId,
        sampling_unit_id: v.samplingUnitId,
        growth_form: v.growthForm,
        scientific_name: v.speciesName,
        abundance: v.abundanceCount,
        cover_percent: v.coverPercentage,
        height_cm: v.avgHeightCm,
        local_x: v.localX,
        local_y: v.localY
    }));
    zip.file('data/vegetation.csv', toCSV(vegData));

    // 5. TAXONOMY.CSV (The Master List + Observed)
    // Merge module definitions with actual observations
    const observedSpecies = new Set([...trees.map(t => t.speciesName), ...veg.map(v => v.speciesName)]);
    const definedSpecies = new Map();
    
    modules.forEach(m => {
        m.predefinedSpeciesList?.forEach(s => {
            definedSpecies.set(s.scientificName, { ...s, source: 'module_definition' });
        });
    });

    const taxonomyRows = Array.from(observedSpecies).map(sp => {
        const def = definedSpecies.get(sp);
        return {
            scientific_name: sp,
            common_name: def?.commonName || '',
            type: def?.type || 'UNKNOWN',
            source: def ? 'defined' : 'observed_custom'
        };
    });
    zip.file('data/taxonomy.csv', toCSV(taxonomyRows));

    // 6. GIS DATA (GeoJSON)
    const geoJson = toGeoJSON(plots);
    zip.file('spatial/plots.geojson', JSON.stringify(geoJson, null, 2));

    // 7. METADATA (Machine Readable)
    const metadata = {
        project: {
            name: project.name,
            id: project.id,
            exportDate: new Date().toISOString(),
            generator: "Terra Platform v1.0"
        },
        stats: {
            plotCount: plots.length,
            treeCount: trees.length,
            vegCount: veg.length,
            speciesCount: observedSpecies.size
        },
        protocols: modules.map(m => ({
            name: m.name,
            method: m.samplingMethod,
            minTreeGBH: m.strataRules?.minTreeGbhCm,
            minShrubHeight: m.strataRules?.minShrubHeightCm
        }))
    };
    zip.file('metadata.json', JSON.stringify(metadata, null, 2));

    // 8. README (Human Readable)
    const readme = `
PROJECT: ${project.name}
EXPORT DATE: ${new Date().toLocaleDateString()}

CONTENTS:
---------
1. /data/plots.csv      - Site metadata and geolocation
2. /data/trees.csv      - Individual tree measurements (GBH, Height)
3. /data/vegetation.csv - Non-tree vegetation records
4. /data/taxonomy.csv   - Species list (defined + observed)
5. /spatial/plots.geojson - GIS vector file for plot locations

DATA STANDARDS:
---------------
- Coordinate System: WGS84 (EPSG:4326)
- Units: Meters (Distance/Height), Centimeters (GBH)
- Missing Values: Empty string or appropriate NULL indicator

GENERATED BY: Terra Platform
    `.trim();
    zip.file('README.txt', readme);

    // 9. Finalize
    console.log("📦 Compressing bundle...");
    const blob = await zip.generateAsync({ type: 'blob' });
    const cleanName = project.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    saveAs(blob, `${cleanName}_analyst_bundle.zip`);
    console.log("✅ Bundle downloaded.");
}
```
