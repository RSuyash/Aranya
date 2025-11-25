export type ShapeDefinition =
    | { kind: 'RECTANGLE'; width: number; length: number }
    | { kind: 'CIRCLE'; radius: number }
    | { kind: 'LINE'; length: number; width?: number } // Transect
    | { kind: 'POINT'; radius?: number }; // Point quadrat

export type Anchor = 'CENTER' | 'TOP_LEFT' | 'TOP_RIGHT' | 'BOTTOM_RIGHT' | 'BOTTOM_LEFT';

export type RowOrder = 'TOP_TO_BOTTOM' | 'BOTTOM_TO_TOP';
export type ColOrder = 'LEFT_TO_RIGHT' | 'RIGHT_TO_LEFT';

export type ChildrenGenerator =
    | {
        method: 'GRID';
        grid: {
            rows: number;
            cols: number;
            rowOrder?: RowOrder; // Default: TOP_TO_BOTTOM
            colOrder?: ColOrder; // Default: LEFT_TO_RIGHT
            labelPattern?: string; // e.g. "Q{i}", "R{r}C{c}"
            startIndex?: number; // Default 1
        }
    }
    | {
        method: 'NESTED';
        child: PlotNodeDefinition
    }
    | {
        method: 'FIXED_LIST';
        children: Array<{
            definition: PlotNodeDefinition;
            position: {
                parentAnchor: Anchor;
                childAnchor?: Anchor; // Default CENTER
                offsetX?: number; // Meters
                offsetY?: number; // Meters
            }
        }>
    };

export interface PlotBlueprint {
    id: string;       // e.g. "std-10x10"
    version: number;  // e.g. 1
    name: string;
    root: PlotNodeDefinition;
}

export interface PlotNodeDefinition {
    type: 'CONTAINER' | 'SAMPLING_UNIT';
    label?: string; // Display name pattern
    code?: string;  // Semantic code (e.g., "Q", "Sub")

    shape: ShapeDefinition;

    childrenGenerator?: ChildrenGenerator;

    // Metadata for analytics
    role?: 'MAIN_PLOT' | 'QUADRANT' | 'SUBPLOT' | 'TRANSECT' | 'POINT' | 'OTHER';
    tags?: string[];
}

export interface PlotNodeInstance {
    id: string;              // Globally unique & stable (Hash of blueprintId + version + path)
    blueprintId: string;
    blueprintVersion: number; // [NEW] Explicit version
    plotId?: string;          // [NEW] Optional link to parent plot

    type: 'CONTAINER' | 'SAMPLING_UNIT';
    label: string;           // Resolved label (e.g., "Q1")
    path: string;            // e.g., "root/row0col1" (Debugging/Migration)

    shape: ShapeDefinition;

    // Concrete Geometry (Canonical Meters)
    x: number;
    y: number;
    rotation?: number;       // Degrees

    // [NEW] Propagated Metadata for Querying/Styling
    role?: 'MAIN_PLOT' | 'QUADRANT' | 'SUBPLOT' | 'TRANSECT' | 'POINT' | 'OTHER';
    tags?: string[];

    children: PlotNodeInstance[];
}

export interface SubplotRule {
    type: 'fixed' | 'random';
    shape: 'RECTANGLE' | 'CIRCLE';
    dimensions: { width?: number; length?: number; radius?: number };
    position: 'CORNER_NW' | 'CORNER_NE' | 'CORNER_SW' | 'CORNER_SE' | 'CENTER';

    // CRITICAL: Defines what we measure here
    strata: ('HERB' | 'SHRUB' | 'SAPLING')[];

    // Does this subplot exclude trees? (Usually false)
    excludesCanopy: boolean;
}

export interface PlotConfiguration {
    // 1. Geometry
    shape: 'RECTANGLE' | 'CIRCLE';
    dimensions: { width: number; length: number; radius?: number };

    // 2. The Grid (Quadrants)
    grid: {
        enabled: boolean;
        rows: number;    // e.g., 2
        cols: number;    // e.g., 2
        labelStyle: 'Q1-Q4' | 'Alpha' | 'Matrix'; // "Q1", "A,B,C", "1,1"
    };

    // 3. Nested Sampling Units (Subplots)
    subplots: {
        enabled: boolean;
        rules: SubplotRule[];
    };

    // 4. Ecological Rules
    rules: {
        minInterTreeDistance: number; // meters (default 0.5)
    };
}
