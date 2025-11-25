import React from 'react';
import { Play, Map as MapIcon, TreeDeciduous, Sprout } from 'lucide-react';
import type { Plot } from '../../../core/data-model/types';
import type { ProgressByUnit, ObsSummaryByUnit } from './plotVisualizerUtils';
import { getAggregateStats } from './plotVisualizerUtils';

interface PlotOverviewPanelProps {
    plot: Plot;
    progressByUnit: ProgressByUnit;
    obsSummaryByUnit: ObsSummaryByUnit;
    onStartSurvey: () => void;
}

export const PlotOverviewPanel: React.FC<PlotOverviewPanelProps> = ({
    plot,
    progressByUnit,
    obsSummaryByUnit,
    onStartSurvey
}) => {
    // Calculate Progress
    const totalUnits = Object.keys(progressByUnit).length; // Note: This might be 0 if no progress records yet. 
    // Ideally we'd get total units from layout, but for now this is a proxy if we pre-fill progress.
    // Better: Pass total expected units count or calculate from layout if available.
    // For now, let's count 'DONE' status.
    const completedUnits = Object.values(progressByUnit).filter(p => p.status === 'DONE').length;
    const progressPercent = totalUnits > 0 ? Math.round((completedUnits / totalUnits) * 100) : 0;

    const { totalTrees, totalVeg } = getAggregateStats(obsSummaryByUnit);

    return (
        <div className="h-full flex flex-col bg-[#0b1020] border-t md:border-t-0 md:border-l border-[#1d2440] shadow-xl w-full md:w-[400px]">
            {/* Header */}
            <div className="px-6 py-4 border-b border-[#1d2440] bg-[#050814]">
                <div className="flex items-center justify-between mb-2">
                    <h2 className="text-lg font-bold text-[#f5f7ff]">Plot Overview</h2>
                    <span className="px-2 py-0.5 rounded-full bg-[#11182b] border border-[#1d2440] text-[10px] text-[#9ba2c0]">
                        {plot.code}
                    </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-[#9ba2c0]">
                    <MapIcon className="w-3.5 h-3.5" />
                    <span>GPS: 3m accuracy</span>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 p-6 space-y-6 overflow-y-auto">
                {/* Progress Section */}
                <div className="bg-[#11182b] border border-[#1d2440] rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-[#9ba2c0] uppercase tracking-wider">Progress</span>
                        <span className="text-sm font-bold text-[#f5f7ff]">{completedUnits} / {totalUnits} Units</span>
                    </div>
                    <div className="h-2 bg-[#050814] rounded-full overflow-hidden">
                        <div
                            className="h-full bg-[#56ccf2] transition-all duration-500"
                            style={{ width: `${progressPercent}%` }}
                        />
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-[#11182b] border border-[#1d2440] rounded-xl p-4 flex flex-col items-center justify-center text-center">
                        <div className="w-10 h-10 rounded-full bg-[#0b2214] border border-[#21452b] flex items-center justify-center mb-2 text-[#52d273]">
                            <TreeDeciduous className="w-5 h-5" />
                        </div>
                        <div className="text-2xl font-bold text-[#f5f7ff]">{totalTrees}</div>
                        <div className="text-xs text-[#9ba2c0]">Trees Recorded</div>
                    </div>
                    <div className="bg-[#11182b] border border-[#1d2440] rounded-xl p-4 flex flex-col items-center justify-center text-center">
                        <div className="w-10 h-10 rounded-full bg-[#071824] border border-[#15324b] flex items-center justify-center mb-2 text-[#56ccf2]">
                            <Sprout className="w-5 h-5" />
                        </div>
                        <div className="text-2xl font-bold text-[#f5f7ff]">{totalVeg}</div>
                        <div className="text-xs text-[#9ba2c0]">Veg Records</div>
                    </div>
                </div>

                {/* Actions */}
                <button
                    onClick={onStartSurvey}
                    className="w-full bg-[#56ccf2] text-[#050814] font-bold py-3 rounded-xl hover:bg-[#4ab8de] transition flex items-center justify-center gap-2 shadow-lg shadow-[#56ccf2]/20"
                >
                    <Play className="w-5 h-5 fill-current" />
                    {completedUnits > 0 ? 'Continue Survey' : 'Start Survey'}
                </button>
            </div>
        </div>
    );
};
