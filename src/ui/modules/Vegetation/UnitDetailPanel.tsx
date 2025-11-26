import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../../core/data-model/dexie';
import type { Plot } from '../../../core/data-model/types';
import { Plus, Trash2, CheckCircle, X, ChevronRight, ChevronLeft, Activity, AlertTriangle } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import type { ObsSummaryByUnit, ProgressByUnit } from './plotVisualizerUtils';
import { clsx } from 'clsx';
import { usePlotAnalytics } from '../../../hooks/usePlotAnalytics';
import { useState } from 'react';
import { GINI_RANGES, getGiniInsight } from '../../../analysis/insights/gini';

const InfoTooltip = ({ children, content }: { children: React.ReactNode, content: React.ReactNode }) => {
    const [isVisible, setIsVisible] = useState(false);

    return (
        <div
            className="relative flex items-center"
            onMouseEnter={() => setIsVisible(true)}
            onMouseLeave={() => setIsVisible(false)}
            onClick={() => setIsVisible(!isVisible)}
        >
            {children}
            {isVisible && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-[#161b22] border border-[#1d2440] rounded-xl shadow-2xl z-50 text-xs text-[#9ba2c0]">
                    {content}
                    {/* Arrow */}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-[#1d2440]" />
                    <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-[1px] border-[7px] border-transparent border-t-[#161b22]" />
                </div>
            )}
        </div>
    );
};

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
    plot?: Plot; // Pass the plot object for analytics
}

const StatRow = ({ label, value, unit, diff, alert }: any) => (
    <div className="flex justify-between items-center py-1 border-b border-[#1d2440] last:border-0">
        <span className="text-xs text-[#9ba2c0]">{label}</span>
        <div className="text-right">
            <div className="text-sm font-mono font-bold text-[#f5f7ff] flex items-center justify-end gap-2">
                {/* Warning Dot for Estimates */}
                {alert && (
                    <InfoTooltip content="Estimated value. Height data missing for >50% of trees, so standard allometric equations were used.">
                        <span className="w-2 h-2 rounded-full bg-[#f2c94c] cursor-help" />
                    </InfoTooltip>
                )}
                {value} <span className="text-[#555b75] text-[10px]">{unit}</span>
            </div>
            {diff !== undefined && Math.abs(diff) > 1 && (
                <div className={`text-[9px] ${diff > 0 ? 'text-[#52d273]' : 'text-[#f2c94c]'}`}>
                    {diff > 0 ? '+' : ''}{diff.toFixed(0)}% vs Plot
                </div>
            )}
        </div>
    </div>
);

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
    onPrevUnit,
    plot
}) => {
    // Fetch Data (Trees only for now)
    const trees = useLiveQuery(
        () => db.treeObservations
            .where(['plotId', 'samplingUnitId'])
            .equals([plotId, unitId])
            .toArray(),
        [plotId, unitId]
    ) || [];

    // Also fetch all trees for the plot to calculate plot-level stats for comparison
    const allPlotTrees = useLiveQuery(
        () => db.treeObservations.where('plotId').equals(plotId).toArray(),
        [plotId]
    ) || [];

    const { unitStats, comparison } = usePlotAnalytics(plot, allPlotTrees, unitId, trees);

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
            <div className="px-6 py-4 border-b border-[#1d2440] bg-[#050814] flex-shrink-0">
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
            <div className="grid grid-cols-3 gap-px bg-[#1d2440] flex-shrink-0">
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

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-[#0b1020]">

                {/* 1. Quick Actions */}
                <div className="grid grid-cols-2 gap-3">
                    <button
                        onClick={onAddTree}
                        className="bg-[#11182b] border border-[#1d2440] hover:border-[#52d273] hover:bg-[#0b2214]/30 rounded-xl p-4 flex flex-col items-center justify-center gap-2 transition group"
                    >
                        <div className="w-10 h-10 rounded-full bg-[#0b2214] border border-[#21452b] group-hover:border-[#52d273] flex items-center justify-center text-[#52d273]">
                            <Plus className="w-5 h-5" />
                        </div>
                        <span className="text-sm font-bold text-[#f5f7ff]">Add Tree</span>
                    </button>
                    <button
                        onClick={onAddVeg}
                        className="bg-[#11182b] border border-[#1d2440] hover:border-[#56ccf2] hover:bg-[#071824]/30 rounded-xl p-4 flex flex-col items-center justify-center gap-2 transition group"
                    >
                        <div className="w-10 h-10 rounded-full bg-[#071824] border border-[#15324b] group-hover:border-[#56ccf2] flex items-center justify-center text-[#56ccf2]">
                            <Plus className="w-5 h-5" />
                        </div>
                        <span className="text-sm font-bold text-[#f5f7ff]">Add Veg</span>
                    </button>
                </div>

                {/* 2. Analytics Section */}
                <div className="space-y-3">
                    <h3 className="text-[10px] font-bold text-[#9ba2c0] uppercase tracking-wider flex items-center gap-2">
                        <Activity className="w-3 h-3" /> Live Analytics
                    </h3>

                    <div className="bg-[#161b22] border border-[#1d2440] rounded-xl p-4 space-y-1">
                        <StatRow
                            label="Carbon Stock"
                            value={unitStats?.carbonHa.toFixed(1) || '0.0'}
                            unit="tC/ha"
                            diff={comparison?.carbonDiff}
                            alert={unitStats?.isEstimate}
                        />
                        <StatRow
                            label="Basal Area"
                            value={unitStats?.basalAreaHa.toFixed(1) || '0.0'}
                            unit="m²/ha"
                            diff={comparison?.baDiff}
                        />
                        <StatRow
                            label="Stem Density"
                            value={unitStats?.stemDensityHa.toFixed(0) || '0'}
                            unit="N/ha"
                            diff={comparison?.densityDiff}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-[#161b22] border border-[#1d2440] rounded-xl p-3">
                            <div className="text-[10px] text-[#9ba2c0] mb-1">QMD (Mean Dia)</div>
                            <div className="text-xl font-bold text-[#f5f7ff]">{unitStats?.qmd.toFixed(1) || '0.0'} <span className="text-xs text-[#555b75]">cm</span></div>
                        </div>
                        <div className="bg-[#161b22] border border-[#1d2440] rounded-xl p-3">
                            <div className="text-[10px] text-[#9ba2c0] mb-1">Lorey's Height</div>
                            <div className="text-xl font-bold text-[#56ccf2]">{unitStats?.loreysHeight.toFixed(1) || '0.0'} <span className="text-xs text-[#555b75]">m</span></div>
                        </div>
                    </div>

                    {/* Diversity Alert */}
                    {unitStats?.giniCoeff !== null && unitStats?.giniCoeff !== undefined && (unitStats.stemDensityHa || 0) > 0 && (() => {
                        const gini = unitStats.giniCoeff!;
                        const insight = getGiniInsight(gini);

                        return (
                            <InfoTooltip
                                content={
                                    <div className="space-y-3 min-w-[200px]">
                                        <div>
                                            <div className="font-bold text-[#f5f7ff] mb-1">Structural Diversity</div>
                                            <div className="text-[10px] text-[#9ba2c0]">
                                                Gini Coefficient: <span className="font-mono font-bold text-[#f5f7ff]">{gini.toFixed(2)}</span>
                                            </div>
                                            <div className="text-[10px] text-[#9ba2c0]">
                                                Status: <span style={{ color: insight.color }}>{insight.label}</span>
                                            </div>
                                        </div>

                                        <div className="space-y-1">
                                            <div className="text-[9px] uppercase tracking-wider text-[#555b75] font-bold">Reference Ranges</div>
                                            {GINI_RANGES.map((range, i) => {
                                                const isCurrent = gini >= range.min && gini < range.max;
                                                return (
                                                    <div key={i} className={clsx(
                                                        "flex items-center justify-between text-[10px] p-1.5 rounded",
                                                        isCurrent ? "bg-[#1d2440] border border-[#555b75]" : "opacity-50"
                                                    )}>
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: range.color }} />
                                                            <span className="text-[#f5f7ff]">{range.label}</span>
                                                        </div>
                                                        <div className="font-mono text-[#9ba2c0]">{range.min}-{range.max}</div>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        <p className="text-[10px] text-[#9ba2c0] italic border-t border-[#1d2440] pt-2 mt-2">
                                            {insight.description}
                                        </p>
                                    </div>
                                }
                            >
                                <div className={clsx(
                                    "flex items-center gap-2 p-2 rounded-lg text-xs cursor-help transition border",
                                    gini < 0.2
                                        ? "bg-[#3a2e10] border-[#f2c94c]/30 text-[#f2c94c] hover:bg-[#3a2e10]/80"
                                        : "bg-[#0b2214] border-[#21452b] text-[#52d273] hover:bg-[#0b2214]/80"
                                )}>
                                    {gini < 0.2 ? <AlertTriangle className="w-4 h-4" /> : <Activity className="w-4 h-4" />}
                                    <span>
                                        {gini < 0.2 ? 'Low' : 'Good'} structural diversity (Gini {gini.toFixed(2)})
                                    </span>
                                </div>
                            </InfoTooltip>
                        );
                    })()}
                </div>

                {/* 3. Mark Done Toggle */}
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

                {/* 4. Recent Trees List */}
                <div className="space-y-3 pb-8">
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
