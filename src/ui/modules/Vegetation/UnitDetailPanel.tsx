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
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-panel-soft border border-border rounded-xl shadow-2xl z-50 text-xs text-text-muted">
                    {content}
                    {/* Arrow */}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-border" />
                    <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-[1px] border-[7px] border-transparent border-t-panel-soft" />
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
    onEditTree?: (treeId: string) => void;
}

const StatRow = ({ label, value, unit, diff, alert, valueColor = "text-text-main" }: any) => (
    <div className="flex justify-between items-center py-1 border-b border-border last:border-0">
        <span className="text-xs text-text-muted">{label}</span>
        <div className="text-right">
            <div className={`text-sm font-mono font-bold flex items-center justify-end gap-2 ${valueColor}`}>
                {/* Warning Dot for Estimates */}
                {alert && (
                    <InfoTooltip content="Estimated value. Height data missing for >50% of trees, so standard allometric equations were used.">
                        <span className="w-2 h-2 rounded-full bg-warning cursor-help" />
                    </InfoTooltip>
                )}
                {value} <span className="text-text-muted text-[10px]">{unit}</span>
            </div>
            {diff !== undefined && Math.abs(diff) > 1 && (
                <div className={`text-[9px] ${diff > 0 ? 'text-success' : 'text-warning'}`}>
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
    plot,
    onEditTree
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
        <div className="h-full flex flex-col bg-panel border-t md:border-t-0 md:border-l border-border shadow-xl w-full md:w-[400px]">
            {/* Header: Use bg-panel-soft for contrast against body */}
            <div className="px-6 py-4 border-b border-border bg-panel-soft flex-shrink-0">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                        <h2 className="text-lg font-bold text-text-main">{unitLabel}</h2>
                        <div className={clsx(
                            "px-2 py-0.5 rounded-full border text-[10px] font-medium",
                            progress?.status === 'DONE' ? "bg-success/10 border-success/30 text-success" :
                                progress?.status === 'IN_PROGRESS' ? "bg-primary/10 border-primary/20 text-primary" :
                                    "bg-app border-border text-text-muted"
                        )}>
                            {progress?.status === 'DONE' ? 'DONE' : progress?.status === 'IN_PROGRESS' ? 'IN PROGRESS' : 'NOT STARTED'}
                        </div>
                    </div>
                    <button onClick={onClose} className="text-text-muted hover:text-text-main transition">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Navigation Chips */}
                <div className="flex items-center justify-between text-xs text-text-muted">
                    <button
                        onClick={onPrevUnit}
                        disabled={!onPrevUnit}
                        className="flex items-center gap-1 px-2 py-1 rounded hover:bg-border hover:text-text-main disabled:opacity-30 disabled:cursor-not-allowed transition"
                        title="Previous Quadrant"
                    >
                        <ChevronLeft className="w-4 h-4" />
                        <span className="text-xs">Previous</span>
                    </button>
                    <button
                        onClick={onNextUnit}
                        disabled={!onNextUnit}
                        className="flex items-center gap-1 px-2 py-1 rounded hover:bg-border hover:text-text-main disabled:opacity-30 disabled:cursor-not-allowed transition"
                        title="Next Quadrant"
                    >
                        <span className="text-xs">Next</span>
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Mini Stats Row */}
            <div className="grid grid-cols-3 gap-px bg-border flex-shrink-0">
                <div className="bg-panel p-3 flex flex-col items-center justify-center">
                    <span className="text-lg font-bold text-text-main">{obsSummary?.treeCount || 0}</span>
                    <span className="text-[10px] text-text-muted uppercase tracking-wider">Trees</span>
                </div>
                <div className="bg-panel p-3 flex flex-col items-center justify-center">
                    <span className="text-lg font-bold text-text-main">{obsSummary?.vegCount || 0}</span>
                    <span className="text-[10px] text-text-muted uppercase tracking-wider">Veg</span>
                </div>
                <div className="bg-panel p-3 flex flex-col items-center justify-center">
                    <span className="text-lg font-bold text-text-main">--</span>
                    <span className="text-[10px] text-text-muted uppercase tracking-wider">Spp.</span>
                </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-panel">

                {/* 1. Quick Actions */}
                <div className="grid grid-cols-2 gap-3">
                    <button
                        onClick={onAddTree}
                        className="bg-panel-soft border border-border hover:border-success hover:bg-success/5 rounded-xl p-4 flex flex-col items-center justify-center gap-2 transition group"
                    >
                        <div className="w-10 h-10 rounded-full bg-success/10 border border-success/30 group-hover:border-success flex items-center justify-center text-success">
                            <Plus className="w-5 h-5" />
                        </div>
                        <span className="text-sm font-bold text-text-main">Add Tree</span>
                    </button>
                    <button
                        onClick={onAddVeg}
                        className="bg-panel-soft border border-border hover:border-primary hover:bg-primary/5 rounded-xl p-4 flex flex-col items-center justify-center gap-2 transition group"
                    >
                        <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 group-hover:border-primary flex items-center justify-center text-primary">
                            <Plus className="w-5 h-5" />
                        </div>
                        <span className="text-sm font-bold text-text-main">Add Veg</span>
                    </button>
                </div>

                {/* 2. Analytics Section */}
                <div className="space-y-3">
                    <h3 className="text-[10px] font-bold text-text-muted uppercase tracking-wider flex items-center gap-2">
                        <Activity className="w-3 h-3" /> Live Analytics
                    </h3>

                    <div className="bg-panel-soft border border-border rounded-xl p-4 space-y-1">
                        <StatRow
                            label="Carbon Stock"
                            value={unitStats?.carbonHa.toFixed(1) || '0.0'}
                            unit="tC/ha"
                            diff={comparison?.carbonDiff}
                            alert={unitStats?.isEstimate}
                            valueColor="text-success"
                        />
                        <StatRow
                            label="Basal Area"
                            value={unitStats?.basalAreaHa.toFixed(1) || '0.0'}
                            unit="m²/ha"
                            diff={comparison?.baDiff}
                            valueColor="text-primary"
                        />
                        <StatRow
                            label="Stem Density"
                            value={unitStats?.stemDensityHa.toFixed(0) || '0'}
                            unit="N/ha"
                            diff={comparison?.densityDiff}
                            valueColor="text-warning"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-panel-soft border border-border rounded-xl p-3">
                            <div className="text-[10px] text-text-muted mb-1">QMD (Mean Dia)</div>
                            <div className="text-xl font-bold text-primary">{unitStats?.qmd.toFixed(1) || '0.0'} <span className="text-xs text-text-muted">cm</span></div>
                        </div>
                        <div className="bg-panel-soft border border-border rounded-xl p-3">
                            <div className="text-[10px] text-text-muted mb-1">Lorey's Height</div>
                            <div className="text-xl font-bold text-primary">{unitStats?.loreysHeight.toFixed(1) || '0.0'} <span className="text-xs text-text-muted">m</span></div>
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
                                            <div className="font-bold text-text-main mb-1">Structural Diversity</div>
                                            <div className="text-[10px] text-text-muted">
                                                Gini Coefficient: <span className="font-mono font-bold text-text-main">{gini.toFixed(2)}</span>
                                            </div>
                                            <div className="text-[10px] text-text-muted">
                                                Status: <span style={{ color: insight.color }}>{insight.label}</span>
                                            </div>
                                        </div>

                                        <div className="space-y-1">
                                            <div className="text-[9px] uppercase tracking-wider text-text-muted font-bold">Reference Ranges</div>
                                            {GINI_RANGES.map((range, i) => {
                                                const isCurrent = gini >= range.min && gini < range.max;
                                                return (
                                                    <div key={i} className={clsx(
                                                        "flex items-center justify-between text-[10px] p-1.5 rounded",
                                                        isCurrent ? "bg-border border border-text-muted" : "opacity-50"
                                                    )}>
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: range.color }} />
                                                            <span className="text-text-main">{range.label}</span>
                                                        </div>
                                                        <div className="font-mono text-text-muted">{range.min}-{range.max}</div>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        <p className="text-[10px] text-text-muted italic border-t border-border pt-2 mt-2">
                                            {insight.description}
                                        </p>
                                    </div>
                                }
                            >
                                <div className={clsx(
                                    "flex items-center gap-2 p-2 rounded-lg text-xs cursor-help transition border",
                                    gini < 0.2
                                        ? "bg-warning/20 border-warning/30 text-warning hover:bg-warning/30"
                                        : "bg-success/20 border-success/30 text-success hover:bg-success/30"
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
                <div className="bg-panel-soft border border-border rounded-xl p-4 flex items-center justify-between">
                    <div>
                        <h3 className="text-sm font-medium text-text-main">Unit Status</h3>
                        <p className="text-xs text-text-muted">Mark as complete when finished</p>
                    </div>
                    <button
                        onClick={handleMarkDone}
                        className={clsx(
                            "flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition",
                            progress?.status === 'DONE'
                                ? "bg-success/20 text-success border border-success/30"
                                : "bg-app text-text-muted border border-border hover:text-text-main"
                        )}
                    >
                        <CheckCircle className="w-4 h-4" />
                        {progress?.status === 'DONE' ? 'Completed' : 'Mark Done'}
                    </button>
                </div>

                {/* 4. Recent Trees List */}
                <div className="space-y-3 pb-8">
                    <h3 className="text-xs font-medium text-text-muted uppercase tracking-wider">
                        Recent Trees ({trees.length})
                    </h3>

                    {trees.slice(0, 5).map(tree => (
                        <div
                            key={tree.id}
                            onClick={() => onEditTree?.(tree.id)}
                            className="bg-app border border-border rounded-lg p-3 flex items-center justify-between group cursor-pointer hover:border-primary transition"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded bg-panel-soft flex items-center justify-center text-primary font-mono text-xs">
                                    {tree.tagNumber}
                                </div>
                                <div>
                                    <div className="text-sm text-text-main font-medium">{tree.speciesName}</div>
                                    <div className="text-xs text-text-muted">GBH: {(tree.gbh || 0).toFixed(1)}cm</div>
                                </div>
                            </div>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (confirm('Are you sure you want to delete this tree?')) {
                                        db.treeObservations.delete(tree.id);
                                    }
                                }}
                                className="text-text-muted hover:text-danger opacity-0 group-hover:opacity-100 transition p-2"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    ))}

                    {trees.length === 0 && (
                        <div className="text-center py-8 text-text-muted text-sm bg-app/50 rounded-xl border border-dashed border-border">
                            No trees recorded yet.
                        </div>
                    )}
                    {trees.length > 5 && (
                        <button className="w-full py-2 text-xs text-primary hover:underline">
                            View All {trees.length} Trees
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
