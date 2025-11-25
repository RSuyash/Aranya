# Implementation Plan - Project Terra: Vegetation Analysis Platform

# Goal Description
Build a "premium", offline-first web application for ecologists to manage field projects, visualize plots (10x10m, etc.), collect species data (trees, shrubs, herbs), and perform basic analysis. The app must support complex plot configurations (quadrants, subplots), image capture, and CSV export/import for data resilience.

## User Review Required
> [!IMPORTANT]
> **Final Schema Integration**: I have updated the **Quadrant**, **Subplot**, and **Observation** schemas to match your exact "Premium" specifications (Clockwise ordering, Anchor positions, Multi-stem trees). This is now the blueprint for development.

## Proposed Architecture
-   **Core**: React 18, TypeScript, Vite
-   **State/Data**: Dexie.js (IndexedDB) for offline storage.
-   **Styling**: Vanilla CSS with Design Tokens (Variables).
-   **Routing**: React Router DOM.

## Data Model Discussion (Finalized Blueprint)

### 1. Project
*   **Purpose**: The "Brain" of the study. Contains all rules, definitions, and master lists.
*   **Schema**:
    ```typescript
    interface Project {
      id: string; // UUID
      name: string;
      description: string;
      ownerName: string;
      collaborators: string[]; 
      samplingMethod: 'RANDOM' | 'SYSTEMATIC' | 'TRANSECT'; 
      
      // The Master List
      predefinedSpeciesList?: { 
        scientificName: string; commonName: string; family?: string; type: 'TREE' | 'SHRUB' | 'HERB' | 'ALL' 
      }[];

      // Definitions
      strataRules: { minTreeGbhCm: number; minShrubHeightCm: number; };

      // Validation
      validationSettings: { requireGpsAccuracy: number; mandatoryPhotos: boolean; };

      // Custom Data
      customPlotAttributes: { key: string; label: string; inputType: 'text' | 'number' | 'select'; options?: string[]; }[];

      // Defaults
      defaultPlotSettings: { dimensions: { width: number; length: number; unit: string }; gridConfig: string; };

      createdAt: number;
      updatedAt: number;
    }
    ```

### 2. Plot
*   **Purpose**: A specific physical area.
*   **Schema**:
    ```typescript
    interface Plot {
      id: string; // UUID
      projectId: string; // FK
      name: string; // "P-101"
      code: string; 
      
      // Geometry
      shape: 'SQUARE' | 'RECTANGLE' | 'CIRCLE'; 
      dimensions: { width: number; length: number; radius?: number; unit: 'm' | 'ft'; };
      coordinates: { lat: number; lng: number; accuracy: number; altitude?: number; };
      orientation: number; // 0-360 degrees
      
      // Topography & Habitat
      slope: number; // Degrees
      aspect: string; // "N", "NE"
      habitatType: string; 
      groundCover?: { rockPercent: number; bareSoilPercent: number; litterPercent: number; vegetationPercent: number; };
      disturbanceType?: 'NONE' | 'FIRE' | 'GRAZING' | 'CUTTING' | 'OTHER';
      
      // Images
      images: Array<{ id: string; url: string; type: 'SITE_CONTEXT' | 'CANOPY' | 'SOIL'; label?: string; timestamp: number; }>;

      // Metadata
      status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'ARCHIVED';
      surveyors: string[]; 
      surveyDate: string; 
      startTime?: number; 
      endTime?: number;   
      customAttributes: Record<string, any>; // Stores values for Project.customPlotAttributes

      createdAt: number;
      updatedAt: number;
    }
    ```

### 3. Quadrant & Subplot (The Spatial Framework)
*   **Quadrant Logic**: Clockwise from North-West (Reading Order).
*   **Subplot Logic**: Defined by Anchor Position.

```typescript
interface Quadrant {
  id: string;
  plotId: string;
  index: number; // 1, 2, 3, 4
  compassDirection: 'NW' | 'NE' | 'SE' | 'SW'; 
  dimensions: { width: number; length: number }; 
}

interface Subplot {
  id: string;
  plotId: string;
  quadrantId?: string; // Optional link
  name: string; // "Center Herb Plot"
  type: 'SHRUB' | 'HERB' | 'SOIL' | 'SEEDLING';
  dimensions: { width: number; length: number; unit: 'm' };
  anchorPosition: 'CENTER' | 'Q_CENTER' | 'CORNER_NW' | 'CORNER_NE' | 'CORNER_SE' | 'CORNER_SW';
}
```

### 4. Observations (The Biological Data)
*   **TreeObservation**: Individual stems, precise tagging.
*   **VegetationObservation**: Aggregated data (Count/Cover) for Subplots.

```typescript
interface TreeObservation {
  id: string;
  plotId: string;
  quadrantId: string; // Mandatory
  
  // Identification
  tagNumber: string; // "T-101"
  speciesName: string; 
  commonName?: string; 
  isUnknown: boolean; 
  confidenceLevel: 'HIGH' | 'MEDIUM' | 'LOW'; 
  
  // Metrics
  gbh: number; // cm
  height: number; // m
  crownDiameter?: number; // m
  stemCount: number; // Default 1 (Multi-stem logic)
  
  // Health & Phenology
  condition: 'ALIVE' | 'DEAD' | 'DAMAGED' | 'DYING';
  phenology: 'VEGETATIVE' | 'FLOWERING' | 'FRUITING' | 'SENESCING';
  
  // Spatial (Optional)
  localX?: number; 
  localY?: number; 
  
  // Media
  images: Array<{ url: string; type: 'BARK' | 'LEAF' | 'FULL' | 'FRUIT'; }>;
  
  remarks?: string;
  surveyorId?: string;
  validationStatus: 'PENDING' | 'VERIFIED' | 'FLAGGED';
}

interface SubplotObservation {
  id: string;
  subplotId: string; // Linked to the specific area
  
  // Classification
  speciesName: string;
  growthForm: 'HERB' | 'SHRUB' | 'CLIMBER' | 'GRASS' | 'FERN'; 
  
  // Quantitative Data
  abundanceCount?: number; 
  coverPercentage?: number; 
  
  // Qualitative Data
  avgHeightCm?: number; 
  
  // Verification
  isUnknown: boolean;
  images: string[]; 
  validationStatus: 'PENDING' | 'VERIFIED';
}
```

## Proposed Changes (Phase 2: Initialization)
*   **Initialize Project**: `npm create vite@latest . -- --template react-ts`
*   **Install Dependencies**: `npm install dexie react-router-dom uuid @types/uuid phosphor-react`
*   **Create `src/db/schema.ts`**: Implement the exact interfaces above.

## Verification Plan
1.  **Schema Validation**: I will create a `test-schema.ts` script that attempts to create valid objects for all the above interfaces and logs them. This ensures our Typescript definitions match the logical requirements.
