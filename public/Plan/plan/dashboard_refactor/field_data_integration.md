# Field Data Integration Plan

**Objective:** Embed the interactive Plot Visualizer and Data Entry forms into the DATA tab of the new Project Dashboard, creating a seamless "Office-to-Field" transition.

## 1. Strategy

The **DATA** tab will host a `FieldDataContainer` that manages two views:
1.  **Map View**: The interactive `PlotVisualizer` for spatial data entry (Field Mode).
2.  **List View**: A high-density table for bulk editing (Office Mode).

## 2. Component Architecture

### A. `FieldDataContainer.tsx` (New Wrapper)
*   **Role**: Manages the view mode state (`MAP` | `LIST`).
*   **Props**: `projectId: string`.
*   **Layout**: Toolbar (View Toggle, New Plot Button) + Content Area.

### B. Refactor `PlotVisualizerPage` -> `PlotVisualizer`
*   **Current State**: `PlotVisualizerPage` is a full page component with routing logic.
*   **New State**: `PlotVisualizer` will be a reusable component accepting `projectId` and `plotId` (optional) as props.
*   **Action**:
    *   Rename/Move logic from `src/ui/modules/Vegetation/PlotVisualizerPage.tsx` to `src/ui/modules/Vegetation/PlotVisualizer.tsx`.
    *   Remove `<AppShell>` wrapper.
    *   Ensure it fits within the parent container.

### C. Update `ProjectDetailsPage.tsx`
*   Import `FieldDataContainer`.
*   Render it when `activeTab === 'DATA'`.

## 3. Implementation Steps

1.  **Create `FieldDataContainer.tsx`**: Implement the shell with the toggle.
2.  **Refactor Visualizer**: Create the `PlotVisualizer` component.
3.  **Integrate**: Update `ProjectDetailsPage` to use `FieldDataContainer`.

## 4. Proposed Code

### `src/ui/modules/DataManagement/FieldDataContainer.tsx`
```tsx
import React, { useState } from 'react';
import { Map, Table, Plus } from 'lucide-react';
// import { PlotVisualizer } from '../Vegetation/PlotVisualizer'; // To be implemented

interface FieldDataContainerProps {
    projectId: string;
}

export const FieldDataContainer: React.FC<FieldDataContainerProps> = ({ projectId }) => {
    const [viewMode, setViewMode] = useState<'MAP' | 'LIST'>('MAP');

    return (
        <div className="h-full flex flex-col">
            {/* Toolbar */}
            <div className="flex justify-between items-center mb-4 px-2">
                <div className="flex bg-[#11182b] rounded-lg p-1 border border-[#1d2440]">
                    <button
                        onClick={() => setViewMode('MAP')}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition ${
                            viewMode === 'MAP' ? 'bg-[#56ccf2] text-[#050814] font-bold' : 'text-[#9ba2c0] hover:text-white'
                        }`}
                    >
                        <Map className="w-4 h-4" /> Map View
                    </button>
                    <button
                        onClick={() => setViewMode('LIST')}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition ${
                            viewMode === 'LIST' ? 'bg-[#56ccf2] text-[#050814] font-bold' : 'text-[#9ba2c0] hover:text-white'
                        }`}
                    >
                        <Table className="w-4 h-4" /> List View
                    </button>
                </div>
                
                <button className="flex items-center gap-2 bg-[#52d273] text-[#050814] px-4 py-2 rounded-lg font-bold text-sm hover:bg-[#45c165] transition">
                    <Plus className="w-4 h-4" /> New Plot
                </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 bg-[#11182b] border border-[#1d2440] rounded-xl overflow-hidden relative">
                {viewMode === 'MAP' ? (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-500">
                        {/* <PlotVisualizer projectId={projectId} /> */}
                        Map View Placeholder
                    </div>
                ) : (
                    <div className="p-8 text-center text-gray-500">
                        List View Placeholder (Ag-Grid or TanStack Table)
                    </div>
                )}
            </div>
        </div>
    );
};
```
