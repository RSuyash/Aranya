import React, { useState } from 'react';
import { Map as MapIcon, Table, Plus } from 'lucide-react';
import { db } from '../../../core/data-model/dexie';
import { v4 as uuidv4 } from 'uuid';
import { PlotVisualizer } from '../Vegetation/PlotVisualizer';

interface FieldDataContainerProps {
    projectId: string;
}

export const FieldDataContainer: React.FC<FieldDataContainerProps> = ({ projectId }) => {
    const [viewMode, setViewMode] = useState<'MAP' | 'LIST'>('MAP');
    const [isNewPlotModalOpen, setIsNewPlotModalOpen] = useState(false);
    const [newPlotName, setNewPlotName] = useState('');

    const handleCreatePlot = async () => {
        if (!newPlotName.trim()) return;

        const id = uuidv4();
        const now = Date.now();

        await db.plots.add({
            id,
            projectId,
            moduleId: 'vegetation', // Default for now
            name: newPlotName,
            code: newPlotName.substring(0, 6).toUpperCase(),
            blueprintId: 'std-10x10-4q',
            blueprintVersion: 1,
            coordinates: { lat: 0, lng: 0, accuracyM: 0 },
            orientation: 0,
            slope: 0,
            aspect: 'N',
            habitatType: 'General',
            images: [],
            status: 'PLANNED',
            surveyors: [],
            surveyDate: new Date().toISOString().split('T')[0],
            customAttributes: {},
            createdAt: now,
            updatedAt: now,
            syncStatus: 'LOCAL_ONLY',
        });

        // Create default sampling units (4 quadrants)
        const samplingUnits = ['q1', 'q2', 'q3', 'q4'];
        for (const suId of samplingUnits) {
            await db.samplingUnits.add({
                id: uuidv4(),
                projectId,
                moduleId: 'vegetation',
                plotId: id,
                samplingUnitId: suId,
                status: 'NOT_STARTED',
                createdAt: now,
                lastUpdatedAt: now
            });
        }

        setIsNewPlotModalOpen(false);
        setNewPlotName('');
    };

    return (
        <div className="h-full flex flex-col relative">
            {/* Toolbar */}
            <div className="flex justify-between items-center mb-4 px-2">
                <div className="flex bg-[#11182b] rounded-lg p-1 border border-[#1d2440]">
                    <button
                        onClick={() => setViewMode('MAP')}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition ${viewMode === 'MAP' ? 'bg-[#56ccf2] text-[#050814] font-bold' : 'text-[#9ba2c0] hover:text-white'
                            }`}
                    >
                        <MapIcon className="w-4 h-4" /> Map View
                    </button>
                    <button
                        onClick={() => setViewMode('LIST')}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition ${viewMode === 'LIST' ? 'bg-[#56ccf2] text-[#050814] font-bold' : 'text-[#9ba2c0] hover:text-white'
                            }`}
                    >
                        <Table className="w-4 h-4" /> List View
                    </button>
                </div>

                <button
                    onClick={() => setIsNewPlotModalOpen(true)}
                    className="flex items-center gap-2 bg-[#52d273] text-[#050814] px-4 py-2 rounded-lg font-bold text-sm hover:bg-[#45c165] transition"
                >
                    <Plus className="w-4 h-4" /> New Plot
                </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 bg-[#11182b] border border-[#1d2440] rounded-xl overflow-hidden relative">
                {viewMode === 'MAP' ? (
                    <div className="absolute inset-0">
                        <PlotVisualizer projectId={projectId} />
                    </div>
                ) : (
                    <div className="p-8 text-center text-gray-500">
                        List View Placeholder (Ag-Grid or TanStack Table)
                    </div>
                )}
            </div>

            {/* New Plot Modal */}
            {isNewPlotModalOpen && (
                <div className="absolute inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
                    <div className="bg-[#11182b] border border-[#1d2440] rounded-xl p-6 w-full max-w-md shadow-2xl">
                        <h3 className="text-lg font-bold text-white mb-4">Create New Plot</h3>
                        <input
                            type="text"
                            placeholder="Plot Name (e.g., P-101)"
                            value={newPlotName}
                            onChange={(e) => setNewPlotName(e.target.value)}
                            className="w-full bg-[#050814] border border-[#1d2440] rounded-lg px-4 py-2 text-white mb-6 focus:border-[#56ccf2] outline-none"
                            autoFocus
                        />
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setIsNewPlotModalOpen(false)}
                                className="px-4 py-2 text-[#9ba2c0] hover:text-white transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreatePlot}
                                disabled={!newPlotName.trim()}
                                className="px-4 py-2 bg-[#52d273] text-[#050814] rounded-lg font-bold hover:bg-[#45c165] disabled:opacity-50 transition"
                            >
                                Create Plot
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
