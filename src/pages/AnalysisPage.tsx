import React, { useMemo, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useRepositories } from '../hooks/useRepositories';
import { calculateShannonIndex, calculateSimpsonIndex, calculateCommunityMetrics, type SpeciesStats } from '../analysis/indices';
import { calculateSAC } from '../analysis/sac';
import { TreeStructure, ChartLineUp, Table, Leaf } from 'phosphor-react';
import { SpeciesAreaCurveChart } from '../components/charts/SpeciesAreaCurveChart';
import { useHeader } from '../context/HeaderContext';
import { SACWizard } from '../components/analysis/SACWizard';

export const AnalysisPage: React.FC = () => {
    const { projectId } = useParams<{ projectId: string }>();
    const navigate = useNavigate();
    const { projects, usePlots, useTreeObservations } = useRepositories();
    const { setHeader } = useHeader();

    const project = projects?.find(p => p.id === projectId);
    const plots = usePlots(projectId);
    const trees = useTreeObservations(projectId);

    // SAC Wizard State
    const [isSACWizardOpen, setIsSACWizardOpen] = useState(false);
    const [sacPlotIds, setSacPlotIds] = useState<string[] | null>(null);

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
        if (!trees.length || !plots.length) return null;

        const counts = Object.values(
            trees.reduce((acc, t) => {
                if (!t.isUnknown) acc[t.speciesName] = (acc[t.speciesName] || 0) + 1;
                return acc;
            }, {} as Record<string, number>)
        );

        const shannon = calculateShannonIndex(counts);
        const simpson = calculateSimpsonIndex(counts);

        // Use selected plots or all plots
        const targetPlotIds = sacPlotIds || plots.map(p => p.id);
        const relevantTrees = trees.filter(t => targetPlotIds.includes(t.plotId));

        const communityStats = calculateCommunityMetrics(relevantTrees, targetPlotIds.length);
        const sacData = calculateSAC(relevantTrees, targetPlotIds);

        return { shannon, simpson, communityStats, sacData, activePlotCount: targetPlotIds.length };
    }, [trees, plots, sacPlotIds]);

    if (!project) {
        return <div className="p-8 text-text-muted">Project not found.</div>;
    }

    return (
        <div className="space-y-8 pb-20">
            {/* Header / Context */}
            <div className="flex justify-between items-start">
                <div>
                    <h2 className="text-2xl font-bold text-text-main">Data Analysis</h2>
                    <p className="text-text-muted">Real-time ecological insights for {project.name}</p>
                </div>
                <button
                    onClick={() => navigate(`/projects/${projectId}`)}
                    className="px-4 py-2 bg-panel-soft text-text-muted hover:text-text-main border border-border rounded-lg hover:bg-panel transition shadow-sm"
                >
                    Back to Project
                </button>
            </div>

            {isSACWizardOpen && (
                <SACWizard
                    plots={plots}
                    onClose={() => setIsSACWizardOpen(false)}
                    onRun={(selectedIds) => {
                        setSacPlotIds(selectedIds);
                        setIsSACWizardOpen(false);
                    }}
                />
            )}

            {(!metrics) ? (
                <div className="bg-panel/50 border border-dashed border-border p-12 text-center text-text-muted rounded-2xl">
                    <ChartLineUp size={48} className="mx-auto mb-4 opacity-20" />
                    <p>Insufficient data to generate insights.</p>
                    <p className="text-xs mt-2">Add at least one plot with tree observations.</p>
                </div>
            ) : (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

                    {/* 1. KEY INDICES (Holographic Cards) */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-panel border border-border p-5 rounded-2xl border-l-4 border-l-primary shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-3 mb-2 text-primary">
                                <Leaf size={24} weight="duotone" />
                                <h3 className="font-bold text-xs uppercase tracking-widest">Shannon Index (H')</h3>
                            </div>
                            <p className="text-4xl font-black text-text-main tracking-tight">{metrics.shannon.toFixed(3)}</p>
                            <p className="text-xs text-text-muted mt-1 font-medium">Alpha Diversity & Evenness</p>
                        </div>

                        <div className="bg-panel border border-border p-5 rounded-2xl border-l-4 border-l-success shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-3 mb-2 text-success">
                                <TreeStructure size={24} weight="duotone" />
                                <h3 className="font-bold text-xs uppercase tracking-widest">Simpson's (1-D)</h3>
                            </div>
                            <p className="text-4xl font-black text-text-main tracking-tight">{metrics.simpson.toFixed(3)}</p>
                            <p className="text-xs text-text-muted mt-1 font-medium">Probability of Interspecific Encounter</p>
                        </div>

                        <div className="bg-panel border border-border p-5 rounded-2xl border-l-4 border-l-warning shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-3 mb-2 text-warning">
                                <ChartLineUp size={24} weight="duotone" />
                                <h3 className="font-bold text-xs uppercase tracking-widest">Species Richness</h3>
                            </div>
                            <p className="text-4xl font-black text-text-main tracking-tight">{metrics.communityStats.length}</p>
                            <p className="text-xs text-text-muted mt-1 font-medium">Unique Taxa Observed</p>
                        </div>
                    </div>

                    {/* 2. SPECIES ACCUMULATION CURVE */}
                    <div className="bg-panel border border-border p-6 rounded-2xl shadow-sm">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-text-main flex items-center gap-2">
                                <ChartLineUp className="text-primary" /> Species Area Curve (SAC)
                            </h3>
                            <button
                                onClick={() => setIsSACWizardOpen(true)}
                                className="text-xs font-bold bg-panel-soft text-primary px-3 py-1.5 rounded-lg hover:bg-primary/10 transition border border-border hover:border-primary/30"
                            >
                                Config: {sacPlotIds ? `${sacPlotIds.length} Plots` : 'All Plots'}
                            </button>
                        </div>
                        {/* We render the chart wrapper */}
                        <SpeciesAreaCurveChart
                            data={metrics.sacData}
                            mode="random"
                            height={320}
                            className="w-full"
                        />
                    </div>

                    {/* 3. COMMUNITY MATRIX */}
                    <div className="bg-panel border border-border rounded-2xl overflow-hidden shadow-sm">
                        <div className="p-6 border-b border-border bg-panel-soft/50">
                            <h3 className="text-lg font-bold text-text-main flex items-center gap-2">
                                <Table className="text-primary" /> Dominant Species (IVI)
                            </h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-text-muted uppercase bg-panel-soft border-b border-border font-bold tracking-wider">
                                    <tr>
                                        <th className="px-6 py-4">Species</th>
                                        <th className="px-6 py-4 text-right">Abundance</th>
                                        <th className="px-6 py-4 text-right">Basal Area (m²)</th>
                                        <th className="px-6 py-4 text-right">Freq %</th>
                                        <th className="px-6 py-4 text-right text-primary">IVI</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {metrics.communityStats.slice(0, 10).map((stat: SpeciesStats) => (
                                        <tr key={stat.speciesName} className="hover:bg-panel-soft/50 transition-colors group">
                                            <td className="px-6 py-3 font-medium italic text-text-main group-hover:text-primary transition-colors">
                                                {stat.speciesName}
                                            </td>
                                            <td className="px-6 py-3 text-right font-mono text-text-muted">{stat.abundance}</td>
                                            <td className="px-6 py-3 text-right font-mono text-text-muted">{stat.basalArea.toFixed(4)}</td>
                                            <td className="px-6 py-3 text-right font-mono text-text-muted">{stat.frequency.toFixed(1)}%</td>
                                            <td className="px-6 py-3 text-right font-bold text-primary font-mono bg-primary/5">{stat.ivi.toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {metrics.communityStats.length > 10 && (
                            <div className="p-3 text-center text-xs text-text-muted border-t border-border bg-panel-soft/30">
                                Showing top 10 of {metrics.communityStats.length} species
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};