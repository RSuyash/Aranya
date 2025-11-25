# Data Pipeline: Field-to-Lab Architecture (Draft 1)

**Status:** Draft
**Objective:** Secure the "Output" phase of the data lifecycle by implementing a robust Serialization Layer that handles versioning, schema migration, and conflict resolution.

## 1. Executive Summary
We are moving from a simple "dump" export to a **Multi-Format Data Pipeline**. This ensures compliance with scientific standards (e.g., Darwin Core, ForestPlots.net) and provides robust backup/restore capabilities.

## 2. The Three Tiers of Export

We will implement a strategy that serves three distinct user personas:

| Tier | Format | Persona | Use Case | Industry Standard |
| :--- | :--- | :--- | :--- | :--- |
| **Tier 1** | **JSON Archive** | SysAdmin / Backup | Full state restore, migration between tablets. | Redux / Dexie Dump |
| **Tier 2** | **Analyst Bundle (ZIP)** | R / Python Scientist | Relational CSVs (plots.csv, trees.csv) + Metadata (README). | Darwin Core Archive |
| **Tier 3** | **Geo-Spatial** | GeoJSON | Visualizing trees in QGIS / ArcGIS / Google Earth. | OGC GeoJSON |

## 3. The "Analyst Bundle" (Scientific Requirement)
A single CSV file is insufficient as it violates normalization principles. The Analyst Bundle will be a `.zip` file containing:

*   **`plots.csv`**: One row per plot (ID, GPS, Slope, Habitat, Dimensions).
*   **`trees.csv`**: One row per tree (ID, PlotID_FK, Species, GBH, Height, Local X/Y).
*   **`vegetation.csv`**: Non-tree vegetation data.
*   **`taxonomy.csv`**: The master species list used (crucial for reproducibility).
*   **`README.txt`**: Auto-generated file explaining units, surveyor names, and date.

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
*   **Task**: Create `src/utils/export/bundler.ts`.
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
import type { TreeObservation, Plot } from '../../core/data-model/types';

// Helper: Convert Array of Objects to CSV String
function toCSV(data: any[]): string {
    if (!data.length) return '';
    const headers = Object.keys(data[0]);
    const csvRows = [
        headers.join(','), // Header row
        ...data.map(row => headers.map(fieldName => {
            const val = row[fieldName];
            // Handle strings with commas/newlines by quoting
            return typeof val === 'string' ? `"${val.replace(/"/g, '""')}"` : val;
        }).join(','))
    ];
    return csvRows.join('\n');
}

export async function generateAnalystBundle(projectId: string) {
    const zip = new JSZip();
    
    // 1. Fetch Data
    const project = await db.projects.get(projectId);
    const plots = await db.plots.where('projectId').equals(projectId).toArray();
    const trees = await db.treeObservations.where('projectId').equals(projectId).toArray();
    const veg = await db.vegetationObservations.where('projectId').equals(projectId).toArray();
    
    if (!project) throw new Error("Project not found");

    // 2. Prepare Plots CSV (Site Metadata)
    const plotsData = plots.map(p => ({
        plot_id: p.id,
        plot_code: p.code,
        latitude: p.coordinates.lat,
        longitude: p.coordinates.lng,
        slope_deg: p.slope,
        aspect: p.aspect,
        survey_date: p.surveyDate,
        dimensions: p.configuration ? `${p.configuration.dimensions.width}x${p.configuration.dimensions.length}` : 'Legacy'
    }));
    zip.file('data/plots.csv', toCSV(plotsData));

    // 3. Prepare Trees CSV (Biological Data)
    const treesData = trees.map(t => ({
        tree_id: t.id,
        plot_id: t.plotId, // Foreign Key
        tag_number: t.tagNumber,
        scientific_name: t.speciesName,
        gbh_cm: t.gbh,
        height_m: t.height,
        local_x: t.localX,
        local_y: t.localY,
        confidence: t.confidenceLevel,
        validation: t.validationStatus
    }));
    zip.file('data/trees.csv', toCSV(treesData));

    // 4. Prepare Metadata (README)
    const readmeContent = `
PROJECT: ${project.name}
EXPORT DATE: ${new Date().toISOString()}
GENERATOR: Aranya Platform v1.0

FILE DESCRIPTIONS:
- plots.csv: Site-level metadata. Key = plot_id
- trees.csv: Individual tree observations. Link to plots via plot_id
- vegetation.csv: Non-tree vegetation data.

UNITS:
- Coordinates: Decimal Degrees (WGS84)
- Distance/Height: Meters
- Girth (GBH): Centimeters
    `.trim();
    zip.file('README.txt', readmeContent);

    // 5. Generate & Download
    const content = await zip.generateAsync({ type: 'blob' });
    const safeName = project.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    saveAs(content, `${safeName}_analyst_package.zip`);
}
```
