# Data Model Blueprint

This document defines the core data structures for Project Terra. It serves as the single source of truth for the database schema (Dexie.js) and TypeScript interfaces.

## 1. Project (The Container)
The `Project` is now a generic container for multiple scientific activities (Modules).

```typescript
interface Project {
  id: string; // UUID
  name: string; // e.g. "Pune Metro EIA 2025"
  description: string;
  
  // --- People & Access ---
  ownerId: string; 
  ownerName: string;
  collaborators: { id: string; name: string; role: 'EDITOR' | 'VIEWER' }[]; 
  
  // [Future Refactor] Unify owner into members array
  // type ProjectRole = 'OWNER' | 'EDITOR' | 'VIEWER';
  // members?: { id: string; name: string; role: ProjectRole }[];

  // --- Global Settings ---
  createdAt: number;
  updatedAt: number;
}
```

## 2. Modules (The Tools)
A Project contains multiple **Modules**. Currently, we define the **Vegetation Module**.

```typescript
type ModuleType = 'VEGETATION_PLOTS' | 'BIRD_SURVEY' | 'WATER_QUALITY';

interface BaseModule {
  id: string; // UUID
  projectId: string; // FK
  type: ModuleType;
  name: string; // e.g. "North Zone Vegetation"
  status: 'ACTIVE' | 'ARCHIVED';
  
  createdAt: number;
  updatedAt: number;
}

// --- Vegetation Module (formerly "Project") ---
interface VegetationModule extends BaseModule {
  type: 'VEGETATION_PLOTS';
  
  // --- The Science ---
  samplingMethod: 'RANDOM' | 'SYSTEMATIC' | 'TRANSECT'; 
  
  // --- Versioning (Future-Proofing) ---
  protocolVersion?: number; // Increments when rules/validation change
  
  // --- Master Lists ---
  // Note: For large lists (>1000), consider moving this to a separate Dexie store.
  predefinedSpeciesList?: { 
    id: string; 
    scientificName: string; 
    commonName: string; 
    family?: string; 
    type: 'TREE' | 'SHRUB' | 'HERB' | 'ALL';
  }[];

  // --- Definitions (Strata) ---
  strataRules?: {
    minTreeGbhCm?: number; 
    minShrubHeightCm?: number; 
  };

  // --- Validation & Config ---
  validationSettings: {
    maxGpsAccuracyM?: number; 
    mandatoryPhotos: boolean; 
  };

  // --- Custom Attributes ---
  customPlotAttributes: {
    key: string; 
    label: string; 
    inputType: 'text' | 'number' | 'select';
    options?: string[]; 
  }[];

  // --- Defaults ---
  defaultBlueprintId?: string;
  defaultBlueprintVersion?: number;
}
```

## 3. Plot (The Physical Site)
A `Plot` belongs to a specific `VegetationModule`.

```typescript
interface Plot {
  id: string; // UUID
  projectId: string; // Root Project FK (for easy querying)
  moduleId: string;  // VegetationModule FK (The specific survey)
  
  // --- Configuration ---
  blueprintId: string;     
  blueprintVersion: number; 
  protocolVersion?: number; // [Optional] Snapshot of module protocol version at creation
  
  // --- Identification ---
  name: string; // "P-101"
  code: string; // Short code for labels
  
  // --- Geometry & Location ---
  coordinates: { 
    lat: number; 
    lng: number; 
    accuracyM: number; 
    altitude?: number;
  };
  
  orientation: number; // 0-360 degrees (Azimuth)
  
  // --- Topography & Habitat ---
  slope: number; // Degrees
  aspect: string; // "N", "NE", "SW"
  habitatType: string; 
  
  groundCover?: {
    rockPercent: number;
    bareSoilPercent: number;
    litterPercent: number;
    vegetationPercent: number;
  };
  
  disturbanceType?: 'NONE' | 'FIRE' | 'GRAZING' | 'CUTTING' | 'OTHER';
  
  // --- Images ---
  images: Array<{
    id: string;
    url: string; 
    type: 'SITE_CONTEXT' | 'CANOPY' | 'SOIL';
    label?: string; 
    timestamp: number; // epochMillis
    samplingUnitId?: string; // Link to specific quadrant/subplot
  }>;

  // --- Metadata ---
  status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'ARCHIVED';
  surveyors: string[]; 
  surveyDate: string; // ISO "YYYY-MM-DD"
  startTime?: number; // epochMillis
  endTime?: number;   // epochMillis
  
  // Note: Can be tightened to Record<string, string | number | boolean | null> later.
  customAttributes: Record<string, any>; 

  createdAt: number;
  updatedAt: number;
}
```

## 4. Spatial Units (Runtime Instances)
*Note: Quadrants and Subplots are generalized as `PlotNodeInstance` in the Plot Engine.*

### SamplingUnitProgress (Field Workflow)
Tracks the completion status of individual quadrants or subplots.

```typescript
interface SamplingUnitProgress {
  id: string; // UUID
  projectId: string;
  moduleId: string; // [NEW]
  plotId: string;
  samplingUnitId: string; // Links to PlotNodeInstance.id
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'DONE';
  
  createdAt: number;
  lastUpdatedAt: number;
}
```

## 5. Observations (Biological Data)

### Shared Types
```typescript
type ValidationStatus = 'PENDING' | 'VERIFIED' | 'FLAGGED';
```

### TreeObservation
Individual stems. Handles multi-stem trees via `stemCount`.

```typescript
interface TreeObservation {
  id: string;
  projectId: string; // Root Project FK
  moduleId: string;  // VegetationModule FK
  plotId: string;
  
  // --- Location ---
  samplingUnitId: string; // Links to PlotNodeInstance.id
  
  // --- Identification ---
  tagNumber: string; // Unique per Plot
  speciesListId?: string; // Optional FK to VegetationModule.predefinedSpeciesList.id
  speciesName: string; // Denormalized human-readable name
  commonName?: string; 
  
  isUnknown: boolean; 
  confidenceLevel: 'HIGH' | 'MEDIUM' | 'LOW'; 
  
  // --- Metrics ---
  // If stems is undefined: gbh = single stem GBH.
  // If stems is defined: gbh = equivalent GBH computed from stems (e.g. sqrt(sum(gbh^2))).
  gbh?: number; 
  height?: number; // m
  crownDiameter?: number; // m
  
  // --- Multi-Stem Logic ---
  // Detailed recording of individual stems
  stems?: Array<{
    id: string; // UUID for stable editing
    gbh: number; // cm
  }>;
  // UI/display only. Derived from stems.length (if stems) or defaults to 1.
  // NON-EDITABLE in UI. Always recalculated on save.
  stemCount: number; 
  
  // --- Health & Phenology ---
  condition: 'ALIVE' | 'DEAD' | 'DAMAGED' | 'DYING';
  phenology: 'VEGETATIVE' | 'FLOWERING' | 'FRUITING' | 'SENESCING';
  
  // --- Spatial (Optional) ---
  localX?: number; // Relative to Sampling Unit origin
  localY?: number; 
  
  // --- Media ---
  images: Array<{
    url: string;
    type: 'BARK' | 'LEAF' | 'FULL' | 'FRUIT';
  }>;
  
  remarks?: string;
  surveyorId?: string;
  validationStatus: ValidationStatus;
  
  // [Future] Module-specific attributes
  // customAttributes?: Record<string, string | number | boolean | null>;

  createdAt: number;
  updatedAt: number;
}
```

### VegetationObservation (Shrubs & Herbs)
Aggregated data for Subplots.

```typescript
interface VegetationObservation {
  id: string;
  projectId: string;
  moduleId: string; 
  plotId: string;
  
  // --- Location ---
  samplingUnitId: string; 
  
  // --- Classification ---
  speciesListId?: string; // Optional FK
  speciesName: string;
  growthForm: 'HERB' | 'SHRUB' | 'CLIMBER' | 'GRASS' | 'FERN'; 
  
  // --- Quantitative Data ---
  abundanceCount?: number; 
  coverPercentage?: number; 
  
  // --- Qualitative Data ---
  avgHeightCm?: number; 
  
  // --- Verification ---
  isUnknown: boolean;
  confidenceLevel?: 'HIGH' | 'MEDIUM' | 'LOW'; // Added for symmetry
  
  images: Array<{
    url: string;
    type?: 'CANOPY' | 'GROUND' | 'CLOSEUP';
  }>;
  
  validationStatus: ValidationStatus; // Unified status
  
  // [Future] Module-specific attributes
  // customAttributes?: Record<string, string | number | boolean | null>;

  createdAt: number;
  updatedAt: number;
}
```

## 6. Dexie Indexes (Proposed)
These are the primary keys and indexes for the IndexedDB schema.

*   **projects**: `id, name`
*   **modules**: `id, projectId, type, status`
*   **plots**: `id, moduleId, projectId, blueprintId, surveyDate, status`
*   **samplingUnitProgress**: `id, [plotId+samplingUnitId], moduleId`
*   **treeObservations**: `id, projectId, moduleId, plotId, samplingUnitId, [plotId+tagNumber]`
*   **vegetationObservations**: `id, projectId, moduleId, plotId, samplingUnitId`

## 7. Future Extensions (Sync & Meta)
*   **Sync Metadata**: Entities will eventually include `syncStatus` and `remoteId` for backend synchronization.

```typescript
type SyncStatus = 'LOCAL_ONLY' | 'SYNCED' | 'DIRTY';

interface SyncMeta {
  syncStatus: SyncStatus;
  remoteId?: string;
  lastSyncedAt?: number;
  lastChangedByDeviceId?: string; // For conflict resolution
}

// Example usage:
// type SyncedTreeObservation = TreeObservation & SyncMeta;
```
