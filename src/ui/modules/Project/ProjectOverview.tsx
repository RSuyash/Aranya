import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../../core/data-model/dexie';
import { MapPin, Sprout, Trees } from 'lucide-react';

const MetricCard = ({ label, value, icon: Icon, color }: any) => (
    <div className="bg-panel-soft border border-border p-4 rounded-xl flex items-center gap-4">
        <div className={`p-3 rounded-lg ${color} bg-opacity-10`}>
            <Icon className={`w-6 h-6 ${color.replace('bg-', 'text-')}`} />
        </div>
        <div>
            <p className="text-xs text-text-muted uppercase tracking-wider">{label}</p>
            <p className="text-2xl font-bold text-text-main">{value}</p>
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

    // Fallback to 0 to prevent crash/layout shift on first render
    const safeStats = stats || { plots: 0, trees: 0, veg: 0 };

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <MetricCard label="Total Plots" value={safeStats.plots} icon={MapPin} color="bg-primary text-primary" />
                <MetricCard label="Trees Logged" value={safeStats.trees} icon={Trees} color="bg-success text-success" />
                <MetricCard label="Vegetation Records" value={safeStats.veg} icon={Sprout} color="bg-warning text-warning" />
            </div>

            {/* Recent Activity / Map Preview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-panel-soft border border-border rounded-xl p-6 min-h-[300px]">
                    <h3 className="text-sm font-bold text-text-muted mb-4 uppercase">Recent Activity</h3>
                    <div className="text-center text-text-muted mt-20">No recent activity</div>
                </div>
                <div className="bg-panel-soft border border-border rounded-xl p-6 min-h-[300px]">
                    <h3 className="text-sm font-bold text-text-muted mb-4 uppercase">Spatial Distribution</h3>
                    <div className="text-center text-text-muted mt-20">Map Preview Placeholder</div>
                </div>
            </div>
        </div>
    );
};
