import React, { useState } from 'react';
import {
    Archive, FileSpreadsheet, Download,
    HardDrive, RefreshCw, ShieldCheck, FileCode
} from 'lucide-react';
import { exportTerraFile } from '../../../utils/export/bundler';
import { exportTidyCSV } from '../../../utils/export/tidyDataExport';
import { downloadBlob } from '../../../utils/sync/export';

export const DataManagementPanel: React.FC<{ projectId: string }> = ({ projectId }) => {
    const [isExporting, setIsExporting] = useState(false);

    const handleNativeExport = async () => {
        setIsExporting(true);
        try {
            await exportTerraFile(projectId);
        } catch (e) {
            console.error(e);
            alert("Export failed");
        } finally {
            setIsExporting(false);
        }
    };

    const handleAnalystExport = async () => {
        setIsExporting(true);
        try {
            // Generate just the CSVs for quick analysis
            const csvBlob = await exportTidyCSV(projectId, 'separate_rows');
            const date = new Date().toISOString().split('T')[0];
            downloadBlob(csvBlob, `Project_${projectId}_Analyst_${date}.csv`);
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">

            {/* 1. PRIMARY: Native Interchange */}
            <section className="bg-panel-soft border border-primary/30 rounded-2xl p-6 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 transition-all group-hover:bg-primary/10" />

                <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div>
                        <h3 className="text-lg font-bold text-text-main flex items-center gap-2">
                            <Archive className="w-5 h-5 text-primary" />
                            Terra Archive (.fldx)
                        </h3>
                        <p className="text-sm text-text-muted mt-1 max-w-lg">
                            The complete project package. Contains your raw database, photos, and analysis-ready CSVs.
                            Use this for backups or transferring to another device.
                        </p>
                    </div>
                    <button
                        onClick={handleNativeExport}
                        disabled={isExporting}
                        className="flex items-center gap-3 bg-primary hover:bg-primary/80 text-app px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
                    >
                        {isExporting ? <RefreshCw className="animate-spin w-5 h-5" /> : <Download className="w-5 h-5" />}
                        Download Archive
                    </button>
                </div>
            </section>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* 2. SECONDARY: Analyst Data */}
                <section className="bg-panel border border-border rounded-2xl p-6 flex flex-col h-full">
                    <div className="mb-auto">
                        <h3 className="text-base font-bold text-text-main flex items-center gap-2 mb-2">
                            <FileCode className="w-5 h-5 text-success" />
                            Analyst Exports
                        </h3>
                        <p className="text-xs text-text-muted mb-4">
                            Lightweight files optimized for R, Python, or Excel. Does not include full system restore data.
                        </p>
                    </div>

                    <div className="space-y-3">
                        <button
                            onClick={handleAnalystExport}
                            className="w-full flex items-center justify-between p-3 rounded-lg bg-panel-soft border border-border hover:border-success transition-all group"
                        >
                            <span className="text-sm text-text-main group-hover:text-success">Tidy Data CSV (Long Format)</span>
                            <FileSpreadsheet className="w-4 h-4 text-text-muted group-hover:text-success" />
                        </button>
                        <button className="w-full flex items-center justify-between p-3 rounded-lg bg-panel-soft border border-border hover:border-success transition-all group">
                            <span className="text-sm text-text-main group-hover:text-success">Summary Matrix (Excel)</span>
                            <FileSpreadsheet className="w-4 h-4 text-text-muted group-hover:text-success" />
                        </button>
                    </div>
                </section>

                {/* 3. TERTIARY: System Health */}
                <section className="bg-panel border border-border rounded-2xl p-6 flex flex-col h-full">
                    <div className="mb-4">
                        <h3 className="text-base font-bold text-text-main flex items-center gap-2 mb-2">
                            <ShieldCheck className="w-5 h-5 text-primary" />
                            Data Integrity
                        </h3>
                        <p className="text-xs text-text-muted">
                            Verify database health before exporting.
                        </p>
                    </div>

                    <div className="mt-auto p-4 bg-primary/10 border border-primary/20 rounded-xl">
                        <div className="flex items-center gap-3 text-primary">
                            <HardDrive className="w-5 h-5" />
                            <div className="flex-1">
                                <div className="text-xs font-bold uppercase tracking-wider">Local Storage</div>
                                <div className="text-sm font-mono">Sync Status: <span className="text-text-main">Local Only</span></div>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
};
