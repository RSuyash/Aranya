# User Workflows: The "Field-to-Lab" Journey

This document maps the critical user journeys for Project Terra. It ensures we build a UI that supports the actual day-to-day work of an ecologist.

## Flow A: The "Day 1" Setup (Office/Lab)
**Goal**: Prepare a scientifically rigorous project *before* going offline.

1.  **Create Project**:
    *   User clicks "New Project".
    *   Enters Name, Description, Owner Name.
    *   **Taxonomy Setup**:
        *   Option A: **Fetch from API** (GBIF, iNaturalist, Local Bird Atlas).
        *   Option B: **Upload CSV** (`species_list.csv`).
        *   Option C: **Start Empty** (Build list in the field).
    *   **Protocol Definition**: Sets Strata Rules (e.g., "Tree > 30cm GBH") and Validation (e.g., "GPS < 5m").
    *   **Plot Configuration**: Selects a Default Blueprint (e.g., "Standard 10x10m").
2.  **Review & Sync**:
    *   System confirms: "Project Ready. 150 Species loaded."
    *   User ensures device is charged and browser cache is primed (PWA check).

## Flow B: The Field Survey (Offline)
**Goal**: Rapid, error-free data collection in harsh environments.

1.  **Arrival at Site**:
    *   User opens app (Offline Mode).
    *   Selects Project -> "Add Plot".
    *   **Plot Setup**:
        *   App requests GPS Location (High Accuracy).
        *   User confirms "Plot 1" (or enters code "P-101").
        *   User takes **Context Photos** (Landscape, Soil).
        *   User fills Environmental Data (Slope, Aspect, Disturbance).
2.  **The "Grid" View**:
    *   App renders the Plot Map (e.g., 4 Quadrants).
    *   **Navigation**: User can tap any Quadrant to enter/edit, or swipe between them.
3.  **Tree Data Collection**:
    *   User taps "Quadrant 1 (NW)".
    *   Clicks "Add Tree".
    *   **Form**:
        *   **Tag #**: Enters "101".
        *   **Species**:
            *   *Scenario A (Known)*: Types "Tec" -> Selects "Tectona grandis".
            *   *Scenario B (Unknown)*: Types "Unknown Tree 1" -> Snaps Photo -> System tags for later ID.
        *   **Stems**:
            *   User clicks **"Add Stem"**.
            *   Enters GBH for Stem 1 (e.g., 120cm).
            *   (Optional) Clicks "Add Stem" again -> Enters GBH for Stem 2 (90cm).
            *   System auto-calculates "Combined GBH".
        *   **Photo**: Snaps Bark/Leaf.
        *   **Save**: Tree appears in list.
4.  **Vegetation/Subplot Data**:
    *   User switches tab to "Subplots" OR clicks a Subplot on the Map.
    *   Selects "NW Herb Plot".
    *   **Form**: Adds species, counts, and cover %.
5.  **Completion**:
    *   User clicks "Mark Quadrant Done".
    *   **Validation**:
        *   *If Canopy Photo missing*: System shows **Soft Warning**: "Canopy photo missing. Continue anyway?"
        *   User confirms -> Quadrant marked Done.
    *   Moves to Q2.

## Flow C: Data Safety (End of Day)
**Goal**: Ensure no data is lost if the device breaks.

1.  **Auto-Sync (If Network Available)**:
    *   App detects network -> Background sync to server.
2.  **Manual Backup (Critical)**:
    *   User clicks **"Export Data Package"**.
    *   System generates a ZIP containing:
        *   `project.json`
        *   `plots.csv`, `trees.csv`, `vegetation.csv`
        *   **`images/` folder** (Full resolution).
    *   User saves to **Phone Storage** (Local) or Google Drive.
3.  **Restore**:
    *   If app is reinstalled, User clicks "Import Project" -> Selects ZIP -> Project is fully restored.

## Flow D: Analysis (Back in Lab)
**Goal**: Turn raw data into insights.

1.  **Dashboard View**:
    *   **Stats**: "15 Plots, 450 Trees, 32 Species".
    *   **Map**: Visualizes plots on Satellite Map/OpenStreetMaps.
2.  **Species Area Curve (SAC) - The "Spatial Arrangement" Flow**:
    *   User clicks "Analysis" -> "Species Area Curve".
    *   **Step 1: Detection**: System checks for obvious grid patterns (e.g., 9 plots in a 3x3 grid).
    *   **Step 2: Manual Arrangement** (If no pattern found):
        *   User sees a "Virtual Grid" (e.g., 30x30m canvas).
        *   User sees list of "Unassigned Plots" (P1...P9).
        *   **Action**: User drags P1 to Top-Left, P2 to Top-Center, etc.
        *   System snaps them into a valid configuration.
    *   **Step 3: Calculate**:
        *   System computes cumulative species count based on this spatial ordering.
        *   Renders the Curve.
3.  **Export**:
    *   Generates KML files for GIS (QGIS/ArcGIS).
    *   Exports Analysis Reports (PDF/CSV).
