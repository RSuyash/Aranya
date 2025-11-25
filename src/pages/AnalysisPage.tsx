import React, { useMemo, useState } from 'react';
import { useRepositories } from '../hooks/useRepositories';
import { calculateShannonIndex, calculateSimpsonIndex, calculateCommunityMetrics, type SpeciesStats } from '../analysis/indices';
import { calculateSAC, type SACPoint } from '../analysis/sac';
import { Select } from '../components/ui/Select';
import { TreeStructure, ChartLineUp, Table, Leaf } from 'phosphor-react';

export const AnalysisPage: React.FC = () => {
    const { projects, usePlots, useTreeObservations } = useRepositories();
    const [selectedProjectId, setSelectedProjectId] = useState<string>('');

    // Select first project by default
    React.useEffect(() => {
        if (projects.length > 0 && !selectedProjectId) {
            setSelectedProjectId(projects[0].id);
        }
    }, [projects]);

    const plots = usePlots(selectedProjectId);
    const trees = useTreeObservations(selectedProjectId);

    // --- Calculations ---
    const metrics = useMemo(() => {
        if (!trees.length || !plots.length) return null;

        // 1. Diversity
        const counts = Object.values(
            trees.reduce((acc, t) => {
                if (!t.isUnknown) acc[t.speciesName] = (acc[t.speciesName] || 0) + 1;
                return acc;
            }, {} as Record<string, number>)
        );

        const shannon = calculateShannonIndex(counts);
        const simpson = calculateSimpsonIndex(counts);

        // 2. IVI Table
        const communityStats = calculateCommunityMetrics(trees, plots.length);

        // 3. SAC
        const sacData = calculateSAC(trees, plots.map(p => p.id));

        return { shannon, simpson, communityStats, sacData };
    }, [trees, plots]);

    if (projects.length === 0) return <div className="p-8 text-text-muted">No projects found.</div>;

    return (
        <div className="space-y-8 pb-20">
            <div className="flex justify-between items-start">
                <div>
                    <h2 className="text-2xl font-bold text-text-main">Data Analysis</h2>
                    <p className="text-text-muted">Real-time ecological insights.</p>
                </div>
                <div className="w-64">
                    <Select
                        options={projects.map(p => ({ value: p.id, label: p.name }))}
                        value={selectedProjectId}
                        onChange={e => setSelectedProjectId(e.target.value)}
                    />
                </div>
            </div>

            {(!metrics) ? (
                <div className="glass-panel p-12 text-center text-text-muted border-dashed">
                    Not enough data to generate insights. Add at least one plot with trees.
                </div>
            ) : (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">

                    {/* Alpha Diversity Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="glass-panel p-5 rounded-xl border-l-4 border-l-[#56ccf2]">
                            <div className="flex items-center gap-3 mb-2 text-[#56ccf2]">
                                <Leaf size={24} weight="duotone" />
                                <h3 className="font-medium text-sm uppercase tracking-wider">Shannon Index (H')</h3>
                            </div>
                            <p className="text-3xl font-bold text-text-main">{metrics.shannon.toFixed(3)}</p>
                            <p className="text-xs text-text-muted mt-1">Species richness & evenness</p>
                        </div>

                        <div className="glass-panel p-5 rounded-xl border-l-4 border-l-[#52d273]">
                            <div className="flex items-center gap-3 mb-2 text-[#52d273]">
                                <TreeStructure size={24} weight="duotone" />
                                <h3 className="font-medium text-sm uppercase tracking-wider">Simpson's (1-D)</h3>
                            </div>
                            <p className="text-3xl font-bold text-text-main">{metrics.simpson.toFixed(3)}</p>
                            <p className="text-xs text-text-muted mt-1">Probability of interspecific encounter</p>
                        </div>

                        <div className="glass-panel p-5 rounded-xl border-l-4 border-l-[#f2c94c]">
                            <div className="flex items-center gap-3 mb-2 text-[#f2c94c]">
                                <ChartLineUp size={24} weight="duotone" />
                                <h3 className="font-medium text-sm uppercase tracking-wider">Species Richness</h3>
                            </div>
                            <p className="text-3xl font-bold text-text-main">{metrics.communityStats.length}</p>
                            <p className="text-xs text-text-muted mt-1">Unique species observed</p>
                        </div>
                    </div>

                    {/* Species Area Curve Visualization */}
                    <div className="glass-panel p-6 rounded-xl">
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <ChartLineUp /> Species Area Curve (Randomized)
                        </h3>
                        <div className="h-64 flex items-end gap-2 px-2 pb-2 border-b border-l border-[#1d2440]">
                            {metrics.sacData.map((point: SACPoint, idx: number) => {
                                const maxRichness = metrics.sacData[metrics.sacData.length - 1].richness;
                                const heightPct = (point.richness / maxRichness) * 100;
                                return (
                                    <div key={idx} className="flex-1 flex flex-col justify-end group relative">
                                        <div
                                            className="bg-[#56ccf2]/20 border-t-2 border-[#56ccf2] rounded-t-sm hover:bg-[#56ccf2]/40 transition-all"
                                            style={{ height: `${heightPct}%` }}
                                        ></div>
                                        {/* Tooltip */}
                                        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-[#0b1020] border border-[#1d2440] px-2 py-1 text-xs rounded text-white opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-10">
                                            Plots: {point.plotsSampled}, Spp: {point.richness}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                        <div className="flex justify-between text-xs text-text-muted mt-2">
                            <span>1 Plot</span>
                            <span>Cumulative Area Sampled &rarr;</span>
                            <span>{metrics.sacData.length} Plots</span>
                        </div>
                    </div>

                    {/* Top Species Table (IVI) */}
                    <div className="glass-panel p-6 rounded-xl overflow-hidden">
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <Table /> Dominant Species (IVI)
                        </h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-text-muted uppercase bg-[#11182b]">
                                    <tr>
                                        <th className="px-4 py-3">Species</th>
                                        <th className="px-4 py-3 text-right">Abundance</th>
                                        <th className="px-4 py-3 text-right">Basal Area (m²)</th>
                                        <th className="px-4 py-3 text-right">Freq %</th>
                                        <th className="px-4 py-3 text-right text-[#56ccf2]">IVI</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#1d2440]">
                                    {metrics.communityStats.slice(0, 10).map((stat: SpeciesStats) => (
                                        <tr key={stat.speciesName} className="hover:bg-[#11182b]/50 transition-colors">
                                            <td className="px-4 py-3 font-medium italic text-[#f5f7ff]">{stat.speciesName}</td>
                                            <td className="px-4 py-3 text-right">{stat.abundance}</td>
                                            <td className="px-4 py-3 text-right">{stat.basalArea.toFixed(4)}</td>
                                            <td className="px-4 py-3 text-right">{stat.frequency.toFixed(1)}%</td>
                                            <td className="px-4 py-3 text-right font-bold text-[#56ccf2]">{stat.ivi.toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                </div>
            )}
        </div>
    );
};