# Unified Projects Dashboard: Engineering Change Order (Draft 1)

**Objective:** Consolidate scattered project actions (Export, Import, Settings, Stats) into a cohesive, tabbed workspace that separates concerns and reduces cognitive load.

## 1. Conceptual Architecture: The "Workspace" Layout

We will adopt a **Master-Detail pattern with a Tabbed Context**.

### Level 1: The Command Center (Header)
*   **Project Title & Breadcrumbs**: Clear navigation context.
*   **Global Actions**: Sync Status, User Profile.

### Level 2: The Context Tabs (Navigation)
1.  **Overview**: High-level stats, map preview, recent activity.
2.  **Field Data**: The core table view of Plots, Trees, and Vegetation (replaces scattered lists).
3.  **Analysis**: Charts and stats (SAC, Diversity).
4.  **Data Tools**: The new home for Import/Export/Cleaning (Data Management).
5.  **Settings**: Project configuration (Team, Modules).

## 2. Component Architecture

### A. `ProjectDetailsPage.tsx` (The Shell)
*   **Role**: State manager for the active tab and layout container.
*   **State**: `activeTab` ('OVERVIEW' | 'DATA' | 'ANALYSIS' | 'MANAGE' | 'SETTINGS').
*   **Layout**: Header (Title + Tabs) + Content Area (Scrollable).

### B. `ProjectOverview.tsx` (Tab: Overview)
*   **Role**: At-a-glance status board.
*   **Components**:
    *   `MetricCard`: Reusable component for displaying key stats (Total Plots, Trees, etc.).
    *   `RecentActivity`: Placeholder for activity feed.
    *   `MapPreview`: Placeholder for spatial distribution view.

### C. `DataManagementPanel.tsx` (Tab: Data Tools)
*   **Role**: Centralized hub for data operations.
*   **Sections**:
    *   **Export & Publication**: Analyst Bundle (ZIP), Full Backup (JSON), Summary Reports (CSV).
    *   **Import & Migration**: Legacy CSV Import Wizard, Restore from Backup.

### D. `FieldDataGrid` (Tab: Field Data)
*   **Role**: Advanced data table view.
*   **Status**: Placeholder for now, to be implemented in a future phase.

### E. `AnalysisPage` (Tab: Analysis)
*   **Role**: Existing analysis visualization.
*   **Status**: Re-use existing component.

## 3. Implementation Plan

### Step 1: Create Component Shells
*   Create `src/ui/modules/Project/ProjectOverview.tsx`.
*   Create `src/ui/modules/DataManagement/DataManagementPanel.tsx`.

### Step 2: Refactor `ProjectDetailsPage.tsx`
*   Replace the current dashboard layout with the new Tabbed Workspace Shell.
*   Implement the tab switching logic.
*   Integrate the new sub-components.

### Step 3: Wire Up Functionality
*   **Overview**: Connect `useLiveQuery` to fetch real stats from Dexie.
*   **Data Tools**: Connect `generateAnalystBundle` and `exportProject` to the buttons.

## 4. Proposed Code

### `src/pages/ProjectDetailsPage.tsx`
```tsx
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../core/data-model/dexie';
import { 
    LayoutDashboard, 
    Trees, 
    BarChart3, 
    Database, 
    Settings, 
    ArrowLeft 
} from 'lucide-react';
import { clsx } from 'clsx';
import { ProjectOverview } from '../ui/modules/Project/ProjectOverview';
import { DataManagementPanel } from '../ui/modules/DataManagement/DataManagementPanel';
// import { AnalysisPage } from './AnalysisPage'; 

export const ProjectDetailsPage: React.FC = () => {
    const { projectId } = useParams<{ projectId: string }>();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'DATA' | 'ANALYSIS' | 'MANAGE' | 'SETTINGS'>('OVERVIEW');

    const project = useLiveQuery(() => db.projects.get(projectId!), [projectId]);

    if (!project) return <div className="p-8 text-white">Loading Project...</div>;

    const tabs = [
        { id: 'OVERVIEW', label: 'Overview', icon: LayoutDashboard },
        { id: 'DATA', label: 'Field Data', icon: Trees },
        { id: 'ANALYSIS', label: 'Analysis', icon: BarChart3 },
        { id: 'MANAGE', label: 'Data Tools', icon: Database },
        { id: 'SETTINGS', label: 'Settings', icon: Settings },
    ];

    return (
        <div className="flex flex-col h-full bg-[#050814]">
            {/* Header */}
            <div className="border-b border-[#1d2440] bg-[#0b1020] px-6 py-4">
                <div className="flex items-center gap-4 mb-4">
                    <button 
                        onClick={() => navigate('/projects')}
                        className="p-2 hover:bg-[#1d2440] rounded-lg text-[#9ba2c0] transition"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-xl font-bold text-[#f5f7ff]">{project.name}</h1>
                        <div className="flex items-center gap-2 text-xs text-[#9ba2c0]">
                            <span className="px-1.5 py-0.5 bg-[#1d2440] rounded text-[#56ccf2] font-mono">
                                {project.code || 'PROJ'}
                            </span>
                            <span>• Last synced: {new Date(project.updatedAt).toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-1">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={clsx(
                                "flex items-center gap-2 px-4 py-2 rounded-t-lg text-sm font-medium transition-all border-b-2",
                                activeTab === tab.id
                                    ? "border-[#56ccf2] text-[#56ccf2] bg-[#56ccf2]/5"
                                    : "border-transparent text-[#9ba2c0] hover:text-[#f5f7ff] hover:bg-[#1d2440]/50"
                            )}
                        >
                            <tab.icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto bg-[#050814] p-6">
                <div className="max-w-7xl mx-auto">
                    {activeTab === 'OVERVIEW' && <ProjectOverview projectId={projectId!} />}
                    {activeTab === 'DATA' && (
                        <div className="text-center text-gray-500 mt-20">
                            <Trees className="w-16 h-16 mx-auto mb-4 opacity-20" />
                            <h3 className="text-lg font-medium">Field Data Grid</h3>
                            <p>Advanced data table view coming soon.</p>
                        </div>
                    )}
                    {activeTab === 'ANALYSIS' && <div className="text-center text-gray-500">Analysis Placeholder</div>}
                    {activeTab === 'MANAGE' && <DataManagementPanel projectId={projectId!} />}
                    {activeTab === 'SETTINGS' && (
                        <div className="text-center text-gray-500 mt-20">Settings Form Placeholder</div>
                    )}
                </div>
            </div>
        </div>
    );
};
```

### `src/ui/modules/DataManagement/DataManagementPanel.tsx`
```tsx
import React from 'react';
import { FileJson, FileSpreadsheet, Archive, UploadCloud, HardDriveDownload, RefreshCw } from 'lucide-react';
import { generateAnalystBundle } from '../../../utils/export/bundler';
import { exportProject, downloadBlob } from '../../../utils/sync/export';

export const DataManagementPanel: React.FC<{ projectId: string }> = ({ projectId }) => {
    
    const handleExportJSON = async () => {
        try {
            const blob = await exportProject(projectId);
            const dateStr = new Date().toISOString().split('T')[0];
            const filename = `project_${projectId}_backup_${dateStr}.json`;
            downloadBlob(blob, filename);
        } catch (e) {
            console.error(e);
            alert("Export failed");
        }
    };

    const handleAnalystBundle = async () => {
        await generateAnalystBundle(projectId);
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Section 1: Export & Publication */}
            <section>
                <div className="mb-4">
                    <h2 className="text-lg font-bold text-[#f5f7ff] flex items-center gap-2">
                        <HardDriveDownload className="w-5 h-5 text-[#56ccf2]" />
                        Export & Publication
                    </h2>
                    <p className="text-sm text-[#9ba2c0]">Download project data for analysis, backup, or reporting.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Analyst Bundle */}
                    <button 
                        onClick={handleAnalystBundle}
                        className="group flex flex-col items-start p-5 bg-[#11182b] border border-[#1d2440] hover:border-[#56ccf2] rounded-xl transition-all text-left"
                    >
                        <div className="p-3 bg-[#56ccf2]/10 rounded-lg mb-3 group-hover:scale-110 transition-transform">
                            <Archive className="w-6 h-6 text-[#56ccf2]" />
                        </div>
                        <h3 className="font-bold text-[#f5f7ff] mb-1">Analyst Bundle (ZIP)</h3>
                        <p className="text-xs text-[#9ba2c0] leading-relaxed">
                            Complete scientific package. Includes relational CSVs, GeoJSON maps, and metadata. Recommended for R/Python analysis.
                        </p>
                    </button>

                    {/* Raw JSON */}
                    <button 
                        onClick={handleExportJSON}
                        className="group flex flex-col items-start p-5 bg-[#11182b] border border-[#1d2440] hover:border-[#f2c94c] rounded-xl transition-all text-left"
                    >
                        <div className="p-3 bg-[#f2c94c]/10 rounded-lg mb-3 group-hover:scale-110 transition-transform">
                            <FileJson className="w-6 h-6 text-[#f2c94c]" />
                        </div>
                        <h3 className="font-bold text-[#f5f7ff] mb-1">Full Backup (JSON)</h3>
                        <p className="text-xs text-[#9ba2c0] leading-relaxed">
                            Raw database dump. Use this for system restoration or migrating data to another device.
                        </p>
                    </button>

                    {/* Simple CSV */}
                    <button className="group flex flex-col items-start p-5 bg-[#11182b] border border-[#1d2440] hover:border-[#52d273] rounded-xl transition-all text-left">
                        <div className="p-3 bg-[#52d273]/10 rounded-lg mb-3 group-hover:scale-110 transition-transform">
                            <FileSpreadsheet className="w-6 h-6 text-[#52d273]" />
                        </div>
                        <h3 className="font-bold text-[#f5f7ff] mb-1">Summary Reports</h3>
                        <p className="text-xs text-[#9ba2c0] leading-relaxed">
                            Simplified Excel tables for quick viewing. Not recommended for complex analysis.
                        </p>
                    </button>
                </div>
            </section>

            {/* Section 2: Import & Migration */}
            <section>
                <div className="mb-4 pt-6 border-t border-[#1d2440]">
                    <h2 className="text-lg font-bold text-[#f5f7ff] flex items-center gap-2">
                        <UploadCloud className="w-5 h-5 text-[#a855f7]" />
                        Import Data
                    </h2>
                    <p className="text-sm text-[#9ba2c0]">Ingest legacy data or restore from backups.</p>
                </div>

                <div className="bg-[#11182b] border border-[#1d2440] rounded-xl p-6 flex flex-col md:flex-row items-center gap-6">
                    <div className="flex-1">
                        <h3 className="font-bold text-[#f5f7ff] mb-2">Legacy CSV Import Wizard</h3>
                        <p className="text-sm text-[#9ba2c0] mb-4">
                            Have old data in Excel? Our intelligent wizard can map your columns to the Aranya schema and reconstruct your plots automatically.
                        </p>
                        <button className="px-4 py-2 bg-[#a855f7] hover:bg-[#9333ea] text-white rounded-lg font-medium text-sm transition flex items-center gap-2">
                            <RefreshCw className="w-4 h-4" /> Launch Wizard
                        </button>
                    </div>
                    
                    <div className="w-full md:w-1/3 border-2 border-dashed border-[#2d3748] hover:border-[#a855f7] rounded-xl h-32 flex flex-col items-center justify-center text-[#555b75] transition cursor-pointer">
                        <UploadCloud className="w-8 h-8 mb-2" />
                        <span className="text-xs font-medium">Drag & Drop files here</span>
                    </div>
                </div>
            </section>
        </div>
    );
};
```

### `src/ui/modules/Project/ProjectOverview.tsx`
```tsx
import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../../core/data-model/dexie';
import { MapPin, Sprout, Trees } from 'lucide-react';

const MetricCard = ({ label, value, icon: Icon, color }: any) => (
    <div className="bg-[#11182b] border border-[#1d2440] p-4 rounded-xl flex items-center gap-4">
        <div className={`p-3 rounded-lg ${color} bg-opacity-10`}>
            <Icon className={`w-6 h-6 ${color.replace('bg-', 'text-')}`} />
        </div>
        <div>
            <p className="text-xs text-[#9ba2c0] uppercase tracking-wider">{label}</p>
            <p className="text-2xl font-bold text-[#f5f7ff]">{value}</p>
        </div>
    </div>
);

export const ProjectOverview: React.FC<{ projectId: string }> = ({ projectId }) => {
    const stats = useLiveQuery(async () => {
        const plots = await db.plots.where('projectId').equals(projectId).count();
        const trees = await db.treeObservations.where('projectId').equals(projectId).count();
        const veg = await db.vegetationObservations.where('projectId').equals(projectId).count();
        return { plots, trees, veg };
    }, [projectId]);

    if (!stats) return <div>Loading stats...</div>;

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <MetricCard label="Total Plots" value={stats.plots} icon={MapPin} color="bg-[#56ccf2] text-[#56ccf2]" />
                <MetricCard label="Trees Logged" value={stats.trees} icon={Trees} color="bg-[#52d273] text-[#52d273]" />
                <MetricCard label="Vegetation Records" value={stats.veg} icon={Sprout} color="bg-[#f2c94c] text-[#f2c94c]" />
            </div>

            {/* Recent Activity / Map Preview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-[#11182b] border border-[#1d2440] rounded-xl p-6 min-h-[300px]">
                    <h3 className="text-sm font-bold text-[#9ba2c0] mb-4 uppercase">Recent Activity</h3>
                    <div className="text-center text-[#555b75] mt-20">No recent activity</div>
                </div>
                <div className="bg-[#11182b] border border-[#1d2440] rounded-xl p-6 min-h-[300px]">
                    <h3 className="text-sm font-bold text-[#9ba2c0] mb-4 uppercase">Spatial Distribution</h3>
                    <div className="text-center text-[#555b75] mt-20">Map Preview Placeholder</div>
                </div>
            </div>
        </div>
    );
};
```
