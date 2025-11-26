import React, { useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useRepositories } from '../hooks/useRepositories';
import { calculateShannonIndex, calculateSimpsonIndex, calculateCommunityMetrics, type SpeciesStats } from '../analysis/indices';
import { calculateSAC } from '../analysis/sac';
import { TreeStructure, ChartLineUp, Table, Leaf } from 'phosphor-react';
import { SpeciesAreaCurveChart } from '../components/charts/SpeciesAreaCurveChart';
import { useHeader } from '../context/HeaderContext';

export const AnalysisPage: React.FC = () => {
    const { projectId } = useParams<{ projectId: string }>();
    const navigate = useNavigate();
    const { projects, usePlots, useTreeObservations } = useRepositories();
    const { setHeader } = useHeader();

    const project = projects?.find(p => p.id === projectId);
    const plots = usePlots(projectId);
    const trees = useTreeObservations(projectId);

    useEffect(() => {
        setHeader({
            title: 'Analysis',
            breadcrumbs: [
                { label: 'Terra', path: '/' },
                { label: 'Projects', path: '/projects' },
                { label: project?.name || '...', path: `/projects/${projectId}` },
                { label: 'Analysis', path: `/projects/${projectId}/analysis` }
            ],
            moduleColor: 'amber',
            isLoading: !project
        });
    }, [project, projectId, setHeader]);

    const metrics = useMemo(() => {
        console.log('🔬 [AnalysisPage] Calculating metrics...');
        console.log('  📊 Trees count:', trees.length);
        console.log('  📍 Plots count:', plots.length);

        if (!trees.length || !plots.length) {
            console.log('  ⚠️  Insufficient data for analysis');
            return null;
        }

        const counts = Object.values(
            trees.reduce((acc, t) => {
                if (!t.isUnknown) acc[t.speciesName] = (acc[t.speciesName] || 0) + 1;
                return acc;
            }, {} as Record<string, number>)
        );

        console.log('  🌳 Species distribution:', trees.reduce((acc, t) => {
            if (!t.isUnknown) acc[t.speciesName] = (acc[t.speciesName] || 0) + 1;
            return acc;
        }, {} as Record<string, number>));

        const shannon = calculateShannonIndex(counts);
        const simpson = calculateSimpsonIndex(counts);
        const communityStats = calculateCommunityMetrics(trees, plots.length);
        const sacData = calculateSAC(trees, plots.map(p => p.id));

        console.log('  ✅ Shannon Index (H\'):', shannon.toFixed(3));
        console.log('  ✅ Simpson\'s Index (1-D):', simpson.toFixed(3));
        console.log('  ✅ Species Richness:', communityStats.length);
        console.log('  ✅ SAC Data points:', sacData.length);
        console.log('  🔍 SAC Full Data:', sacData);
        console.log('  📋 Top 5 species by IVI:');
        communityStats.slice(0, 5).forEach((stat, idx) => {
            console.log(`     ${idx + 1}. ${stat.speciesName}: IVI=${stat.ivi.toFixed(2)}, N=${stat.abundance}`);
        });

        return { shannon, simpson, communityStats, sacData };
    }, [trees, plots]);

    if (!project) {
        return <div className="p-8 text-text-muted">Project not found.</div>;
    }

    return (
        <div className="space-y-8 pb-20">
            <div className="flex justify-between items-start">
                <div>
                    <h2 className="text-2xl font-bold text-text-main">Data Analysis</h2>
                    <p className="text-text-muted">Real-time ecological insights for {project.name}</p>
                </div>
                <button
                    onClick={() => navigate(`/projects/${projectId}`)}
                    className="px-4 py-2 bg-[#1d2440] text-text-muted rounded-lg hover:bg-[#252d4a] transition"
                >
                    Back to Project
                </button>
            </div>

            {(!metrics) ? (
                <div className="glass-panel p-12 text-center text-text-muted border-dashed">
                    Not enough data to generate insights. Add at least one plot with trees.
                </div>
            ) : (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
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

                    <div className="glass-panel p-6 rounded-xl">
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <ChartLineUp /> Species Area Curve (Randomized)
                        </h3>
                        <SpeciesAreaCurveChart
                            data={metrics.sacData}
                            mode="random"
                            height={280}
                            className="mt-2"
                        />
                    </div>

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