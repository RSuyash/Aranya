import React, { useMemo } from 'react';
import {
    Play, Map as MapIcon, TreeDeciduous, Sprout,
    Activity, Scan, Target, Signal, Database
} from 'lucide-react';
import type { Plot } from '../../../core/data-model/types';
import type { ProgressByUnit, ObsSummaryByUnit } from './plotVisualizerUtils';
import { getAggregateStats } from './plotVisualizerUtils';
import { TechSeparator } from '../../../components/ui/TechSeparator';
import { HoloStat } from '../../../components/ui/HoloStat';

// --- VISUAL COMPONENT: PROGRESS MONITOR ---
const ProgressMonitor = ({ completed, total }: { completed: number, total: number }) => {
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

    return (
        <div className="relative p-5 rounded-2xl bg-panel-soft/50 border border-border overflow-hidden">
            {/* Background Mesh */}
            <div className="absolute inset-0 opacity-[0.05] text-text-muted"
                style={{ backgroundImage: 'linear-gradient(0deg, transparent 24%, currentColor 25%, currentColor 26%, transparent 27%, transparent 74%, currentColor 75%, currentColor 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, currentColor 25%, currentColor 26%, transparent 27%, transparent 74%, currentColor 75%, currentColor 76%, transparent 77%, transparent)', backgroundSize: '30px 30px' }}
            />

            <div className="flex justify-between items-end mb-3 relative z-10">
                <div className="flex items-center gap-2 text-primary">
                    <Activity size={16} className={percent < 100 ? "animate-pulse" : ""} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Survey Saturation</span>
                </div>
                <div className="text-2xl font-black text-text-main tracking-tight leading-none">
                    {percent}<span className="text-sm text-text-muted">%</span>
                </div>
            </div>

            <div className="relative h-2 w-full bg-panel rounded-full overflow-hidden border border-border">
                <div
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-blue-500 transition-all duration-1000 ease-out shadow-sm"
                    style={{ width: `${percent}%` }}
                />
            </div>

            <div className="flex justify-between mt-2 text-[9px] font-mono text-text-muted relative z-10">
                <span>Completed: {completed}</span>
                <span>Total Units: {total}</span>
            </div>
        </div>
    );
};

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
    const totalUnits = Object.keys(progressByUnit).length;
    const completedUnits = Object.values(progressByUnit).filter(p => p?.status === 'DONE').length;

    const { totalTrees, totalVeg } = useMemo(
        () => getAggregateStats(obsSummaryByUnit),
        [obsSummaryByUnit]
    );

    return (
        <div className="h-full flex flex-col bg-panel border-t md:border-t-0 md:border-l border-border shadow-2xl w-full md:w-[400px] relative overflow-hidden">
            {/* Background Texture */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none text-text-muted"
                style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)', backgroundSize: '24px 24px' }}
            />

            {/* --- HEADER --- */}
            <div className="px-6 py-6 border-b border-border bg-panel/30 backdrop-blur-md relative z-10">
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Scan size={14} className="text-text-muted" />
                            <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Plot Overview</span>
                        </div>
                        <h2 className="text-3xl font-black text-text-main tracking-tight leading-none">
                            {plot.code}
                        </h2>
                    </div>
                    <div className="flex flex-col items-end">
                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-panel-soft border border-border text-xs font-mono text-primary">
                            <Signal size={12} />
                            <span>±{plot.coordinates.accuracyM.toFixed(0)}m</span>
                        </div>
                        <span className="text-[9px] text-text-muted mt-1 uppercase tracking-wider font-bold">Precision</span>
                    </div>
                </div>
            </div>

            {/* --- CONTENT --- */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar relative z-10">
                <section>
                    <ProgressMonitor completed={completedUnits} total={totalUnits} />
                </section>

                <section>
                    <TechSeparator label="Telemetry" icon={Database} color="text-success" />
                    <div className="grid grid-cols-2 gap-4">
                        <HoloStat label="Biomass" value={totalTrees} unit="TREES" icon={TreeDeciduous} colorClass="from-emerald-500/20 to-green-500/5" borderClass="group-hover:border-emerald-500/50 group-hover:text-emerald-500" />
                        <HoloStat label="Flora" value={totalVeg} unit="OBS" icon={Sprout} colorClass="from-amber-500/20 to-orange-500/5" borderClass="group-hover:border-amber-500/50 group-hover:text-amber-500" />
                    </div>
                </section>

                <section>
                    <TechSeparator label="Spatial Anchor" icon={MapIcon} color="text-primary" />
                    <div className="rounded-2xl bg-panel-soft/50 border border-border p-4 flex items-center gap-4">
                        <div className="p-3 rounded-full bg-primary/10 text-primary">
                            <Target size={20} />
                        </div>
                        <div>
                            <div className="text-xs text-text-muted uppercase tracking-wider font-bold">Coordinates</div>
                            <div className="font-mono text-sm text-text-main">
                                {plot.coordinates.lat.toFixed(5)}°N, {plot.coordinates.lng.toFixed(5)}°E
                            </div>
                        </div>
                    </div>
                </section>
            </div>

            {/* --- FOOTER ACTION --- */}
            <div className="p-6 border-t border-border bg-panel/80 backdrop-blur-xl relative z-20">
                <button
                    onClick={onStartSurvey}
                    className="w-full relative group overflow-hidden rounded-xl bg-primary px-6 py-4 transition-all hover:bg-primary/90 hover:shadow-[0_0_25px_-5px_var(--primary)] active:scale-[0.98]"
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                    <div className="flex items-center justify-center gap-3 text-app font-black uppercase tracking-widest text-sm relative z-10">
                        <Play size={18} fill="currentColor" />
                        {completedUnits > 0 ? 'Resume Operation' : 'Initialize Survey'}
                    </div>
                </button>
            </div>
        </div>
    );
};