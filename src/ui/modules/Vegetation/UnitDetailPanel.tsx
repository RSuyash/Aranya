import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../../core/data-model/dexie';
import type { TreeObservation } from '../../../core/data-model/types';
import { Plus, Save, Trash2, CheckCircle, X, TreeDeciduous, Sprout, ChevronRight, ChevronLeft } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import type { ObsSummaryByUnit, ProgressByUnit } from './plotVisualizerUtils';
import { clsx } from 'clsx';

interface UnitDetailPanelProps {
    projectId: string;
    moduleId: string;
    plotId: string;
    unitId: string;
    unitLabel: string;
    onClose: () => void;
    progress?: ProgressByUnit['string'];
    obsSummary?: ObsSummaryByUnit['string'];
    onAddTree: () => void;
    onAddVeg: () => void; // Placeholder for now
    onNextUnit?: () => void;
    onPrevUnit?: () => void;
}

export const UnitDetailPanel: React.FC<UnitDetailPanelProps> = ({
    projectId,
    moduleId,
    plotId,
    unitId,
    unitLabel,
    onClose,
    progress,
    obsSummary,
    onAddTree,
    onAddVeg,
    onNextUnit,
    onPrevUnit
}) => {
    // Fetch Data (Trees only for now)
    const trees = useLiveQuery(
        () => db.treeObservations
            .where(['plotId', 'samplingUnitId'])
            .equals([plotId, unitId])
            .toArray(),
        [plotId, unitId]
    ) || [];

    const handleMarkDone = async () => {
        const isDone = progress?.status === 'DONE';
        const newStatus = isDone ? 'IN_PROGRESS' : 'DONE';

        const existingProgress = await db.samplingUnits
            .where({ plotId, samplingUnitId: unitId })
            .first();

        if (existingProgress) {
            await db.samplingUnits.update(existingProgress.id, {
                status: newStatus,
                lastUpdatedAt: Date.now()
            });
        } else {
            await db.samplingUnits.add({
                id: uuidv4(),
                projectId,
                moduleId,
                plotId,
                samplingUnitId: unitId,
                status: newStatus,
                createdAt: Date.now(),
                lastUpdatedAt: Date.now()
            });
        }
    };

    return (
        <div className="h-full flex flex-col bg-[#0b1020] border-t md:border-t-0 md:border-l border-[#1d2440] shadow-xl w-full md:w-[400px]">
            {/* Header */}
            <div className="px-6 py-4 border-b border-[#1d2440] bg-[#050814]">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                        <h2 className="text-lg font-bold text-[#f5f7ff]">{unitLabel}</h2>
                        <div className={clsx(
                            "px-2 py-0.5 rounded-full border text-[10px] font-medium",
                            progress?.status === 'DONE' ? "bg-[#0b2214] border-[#21452b] text-[#52d273]" :
                                progress?.status === 'IN_PROGRESS' ? "bg-[#071824] border-[#15324b] text-[#56ccf2]" :
                                    "bg-[#11182b] border-[#1d2440] text-[#9ba2c0]"
                        )}>
                            {progress?.status === 'DONE' ? 'DONE' : progress?.status === 'IN_PROGRESS' ? 'IN PROGRESS' : 'NOT STARTED'}
                        </div>
                    </div>
                    <button onClick={onClose} className="text-[#9ba2c0] hover:text-[#f5f7ff] transition">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Navigation Chips */}
                <div className="flex items-center justify-between text-xs text-[#9ba2c0]">
                    <button
                        onClick={onPrevUnit}
                        disabled={!onPrevUnit}
                        className="flex items-center gap-1 px-2 py-1 rounded hover:bg-[#1d2440] hover:text-[#f5f7ff] disabled:opacity-30 disabled:cursor-not-allowed transition"
                        title="Previous Quadrant"
                    >
                        <ChevronLeft className="w-4 h-4" />
                        <span className="text-xs">Previous</span>
                    </button>
                    <button
                        onClick={onNextUnit}
                        disabled={!onNextUnit}
                        className="flex items-center gap-1 px-2 py-1 rounded hover:bg-[#1d2440] hover:text-[#f5f7ff] disabled:opacity-30 disabled:cursor-not-allowed transition"
                        title="Next Quadrant"
                    >
                        <span className="text-xs">Next</span>
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Mini Stats Row */}
            <div className="grid grid-cols-3 gap-px bg-[#1d2440]">
                <div className="bg-[#0b1020] p-3 flex flex-col items-center justify-center">
                    <span className="text-lg font-bold text-[#f5f7ff]">{obsSummary?.treeCount || 0}</span>
                    <span className="text-[10px] text-[#9ba2c0] uppercase tracking-wider">Trees</span>
                </div>
                <div className="bg-[#0b1020] p-3 flex flex-col items-center justify-center">
                    <span className="text-lg font-bold text-[#f5f7ff]">{obsSummary?.vegCount || 0}</span>
                    <span className="text-[10px] text-[#9ba2c0] uppercase tracking-wider">Veg</span>
                </div>
                <div className="bg-[#0b1020] p-3 flex flex-col items-center justify-center">
                    <span className="text-lg font-bold text-[#f5f7ff]">--</span>
                    <span className="text-[10px] text-[#9ba2c0] uppercase tracking-wider">Spp.</span>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Quick Actions */}
                <div className="grid grid-cols-2 gap-3">
                    <button
                        onClick={onAddTree}
                        className="bg-[#11182b] border border-[#1d2440] hover:border-[#56ccf2] rounded-xl p-4 flex flex-col items-center gap-2 transition group"
                    >
                        <div className="w-10 h-10 rounded-full bg-[#0b2214] border border-[#21452b] group-hover:border-[#56ccf2] flex items-center justify-center text-[#52d273]">
                            <Plus className="w-5 h-5" />
                        </div>
                        <span className="text-sm font-medium text-[#f5f7ff]">Add Tree</span>
                    </button>
                    <button
                        onClick={onAddVeg}
                        className="bg-[#11182b] border border-[#1d2440] hover:border-[#56ccf2] rounded-xl p-4 flex flex-col items-center gap-2 transition group"
                    >
                        <div className="w-10 h-10 rounded-full bg-[#071824] border border-[#15324b] group-hover:border-[#56ccf2] flex items-center justify-center text-[#56ccf2]">
                            <Plus className="w-5 h-5" />
                        </div>
                        <span className="text-sm font-medium text-[#f5f7ff]">Add Veg</span>
                    </button>
                </div>

                {/* Mark Done Toggle */}
                <div className="bg-[#11182b] border border-[#1d2440] rounded-xl p-4 flex items-center justify-between">
                    <div>
                        <h3 className="text-sm font-medium text-[#f5f7ff]">Unit Status</h3>
                        <p className="text-xs text-[#9ba2c0]">Mark as complete when finished</p>
                    </div>
                    <button
                        onClick={handleMarkDone}
                        className={clsx(
                            "flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition",
                            progress?.status === 'DONE'
                                ? "bg-[#0b2214] text-[#52d273] border border-[#21452b]"
                                : "bg-[#050814] text-[#9ba2c0] border border-[#1d2440] hover:text-[#f5f7ff]"
                        )}
                    >
                        <CheckCircle className="w-4 h-4" />
                        {progress?.status === 'DONE' ? 'Completed' : 'Mark Done'}
                    </button>
                </div>

                {/* Recent Trees List */}
                <div className="space-y-3">
                    <h3 className="text-xs font-medium text-[#9ba2c0] uppercase tracking-wider">
                        Recent Trees ({trees.length})
                    </h3>

                    {trees.slice(0, 5).map(tree => (
                        <div key={tree.id} className="bg-[#050814] border border-[#1d2440] rounded-lg p-3 flex items-center justify-between group">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded bg-[#11182b] flex items-center justify-center text-[#56ccf2] font-mono text-xs">
                                    {tree.tagNumber}
                                </div>
                                <div>
                                    <div className="text-sm text-[#f5f7ff] font-medium">{tree.speciesName}</div>
                                    <div className="text-xs text-[#9ba2c0]">GBH: {tree.gbh}cm</div>
                                </div>
                            </div>
                            <button
                                onClick={() => db.treeObservations.delete(tree.id)}
                                className="text-[#9ba2c0] hover:text-[#ff7e67] opacity-0 group-hover:opacity-100 transition"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    ))}

                    {trees.length === 0 && (
                        <div className="text-center py-8 text-[#555b75] text-sm bg-[#050814]/50 rounded-xl border border-dashed border-[#1d2440]">
                            No trees recorded yet.
                        </div>
                    )}
                    {trees.length > 5 && (
                        <button className="w-full py-2 text-xs text-[#56ccf2] hover:underline">
                            View All {trees.length} Trees
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

