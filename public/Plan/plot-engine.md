# Plot Engine Design: The "Configurator"

## 1. Core Architecture: Blueprint vs. Instance
To ensure data integrity and performance, we separate the **Design Time** (Blueprint) from the **Run Time** (Instance).

*   **Blueprint (`PlotBlueprint`)**: The static template (e.g., "Standard 10x10m"). Versioned and immutable once used.
*   **Layout Engine**: A pure function that takes a Blueprint and calculates exact geometry.
*   **Instance (`PlotNodeInstance`)**: The resolved tree with concrete coordinates (x, y), dimensions, and stable IDs. The Renderer and Data Layer *only* interact with this.

## 2. The Blueprint Schema (Design Time)

### Core Types
```typescript
type ShapeDefinition =
  | { kind: 'RECTANGLE'; width: number; length: number }
  | { kind: 'CIRCLE'; radius: number }
  | { kind: 'LINE'; length: number; width?: number } // Transect
  | { kind: 'POINT'; radius?: number }; // Point quadrat

type Anchor = 'CENTER' | 'TOP_LEFT' | 'TOP_RIGHT' | 'BOTTOM_RIGHT' | 'BOTTOM_LEFT';

type RowOrder = 'TOP_TO_BOTTOM' | 'BOTTOM_TO_TOP';
type ColOrder = 'LEFT_TO_RIGHT' | 'RIGHT_TO_LEFT';
```

### Generators (Discriminated Union)
```typescript
type ChildrenGenerator =
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
```

### The Blueprint
```typescript
interface PlotBlueprint {
  id: string;       // e.g. "std-10x10"
  version: number;  // e.g. 1
  name: string;
  root: PlotNodeDefinition;
}

interface PlotNodeDefinition {
  type: 'CONTAINER' | 'SAMPLING_UNIT';
  label?: string; // Display name pattern
  code?: string;  // Semantic code (e.g., "Q", "Sub")
  
  shape: ShapeDefinition;
  
  childrenGenerator?: ChildrenGenerator;
  
  // Metadata for analytics
  role?: 'MAIN_PLOT' | 'SUBPLOT' | 'TRANSECT' | 'POINT' | 'OTHER';
  tags?: string[]; 
}
```

## 3. The Instance Schema (Runtime)

This is what the Renderer draws and what Observations link to.

### Coordinate System
*   **Units**: Meters (Logical).
*   **Origin**: Bottom-Left (South-West) is (0,0).
*   **Axes**: X increases East, Y increases North.

```typescript
interface PlotNodeInstance {
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
  role?: 'MAIN_PLOT' | 'SUBPLOT' | 'TRANSECT' | 'POINT' | 'OTHER';
  tags?: string[]; 

  children: PlotNodeInstance[];
}
```

## 4. The Layout Engine (Logic)

The `generateLayout` function recursively processes the Blueprint to produce the Instance tree.

```typescript
function generateLayout(
  blueprint: PlotBlueprint,
  overrides?: { rootDimensions?: ShapeDefinition },
  plotId?: string // [NEW] Optional for globally unique instance IDs
): PlotNodeInstance {
  // 1. Validate Blueprint
  // 2. Process Root Node (Apply overrides if any)
  // 3. Recursively resolve children based on Generator type
  //    - GRID: Calculate cell x,y based on row/col order and dimensions.
  //    - NESTED: Center child in parent.
  //    - FIXED_LIST: Apply offsets from anchors.
  // 4. Propagate Metadata
  //    - Copy 'role' and 'tags' from Definition to Instance.
  // 5. Generate Stable IDs
  //    - If plotId is provided: Hash(plotId + blueprintId + version + path) -> Globally Unique
  //    - If no plotId: Hash(blueprintId + version + path) -> Blueprint Unique
  return rootInstance;
}
```

## 5. The Renderer (React)

Pure component. Receives the `PlotNodeInstance` tree and a `pixelWidth` scale factor.

```tsx
// Helper to calculate pixel dimensions based on shape kind
function getNodePixelSize(node: PlotNodeInstance, scale: number) {
  const shape = node.shape;
  switch (shape.kind) {
    case 'RECTANGLE':
      return { width: shape.width * scale, height: shape.length * scale };
    case 'CIRCLE':
      return { width: shape.radius * 2 * scale, height: shape.radius * 2 * scale };
    case 'LINE':
      return { width: shape.length * scale, height: (shape.width ?? 0.1) * scale };
    case 'POINT':
      const r = (shape.radius ?? 0.1) * scale;
      return { width: r * 2, height: r * 2 };
  }
}

const PlotRenderer: React.FC<{ root: PlotNodeInstance; pixelWidth: number }> = ({ root, pixelWidth }) => {
  // Calculate scale based on root width (handling different shapes)
  const rootMetricWidth = root.shape.kind === 'RECTANGLE' ? root.shape.width : 
                          root.shape.kind === 'CIRCLE' ? root.shape.radius * 2 : 
                          root.shape.kind === 'LINE' ? root.shape.length : 10;
                          
  const scale = pixelWidth / rootMetricWidth;

  // Calculate container height
  const rootMetricHeight = root.shape.kind === 'RECTANGLE' ? root.shape.length :
                           root.shape.kind === 'CIRCLE' ? root.shape.radius * 2 : 
                           root.shape.kind === 'LINE' ? (root.shape.width ?? 0.1) : 10;

  const renderNode = (node: PlotNodeInstance) => {
    const { width, height } = getNodePixelSize(node, scale);
    
    const style: React.CSSProperties = {
      position: 'absolute',
      left: node.x * scale,
      bottom: node.y * scale, // SW Origin
      width,
      height,
      // ... styling based on node.type, role, tags
    };

    return (
      <div 
        key={node.id} 
        style={style} 
        onClick={node.type === 'SAMPLING_UNIT' ? () => handleSelect(node) : undefined}
      >
        {node.children.map(renderNode)}
      </div>
    );
  };

  return (
    <div style={{ position: 'relative', width: pixelWidth, height: rootMetricHeight * scale }}>
      {renderNode(root)}
    </div>
  );
};
```

## 6. Data Integration
*   **Observations** link to `PlotNodeInstance.id` via `samplingUnitId`.
*   **Projects** store `blueprintId` and `blueprintVersion`.
*   **Migration**: If a Blueprint version changes, we can map old paths to new paths if needed, or keep old instances as-is.
