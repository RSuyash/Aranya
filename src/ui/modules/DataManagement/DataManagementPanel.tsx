import React from 'react';
import { FileJson, FileSpreadsheet, Archive, UploadCloud, HardDriveDownload, RefreshCw } from 'lucide-react';
import { generateAnalystBundle } from '../../../utils/export/bundler';
import { exportProject, downloadBlob } from '../../../utils/sync/export';

export const DataManagementPanel: React.FC<{ projectId: string }> = ({ projectId }) => {

    const handleExportJSON = async () => {
        try {
            const blob = await exportProject(projectId);
            const dateStr = new Date().toISOString().split('T')[0];
            const filename = `project_${projectId}_backup_${dateStr}.json`;
            downloadBlob(blob, filename);
        } catch (e) {
            console.error(e);
            alert("Export failed");
        }
    };

    const handleAnalystBundle = async () => {
        await generateAnalystBundle(projectId);
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Section 1: Export & Publication */}
            <section>
                <div className="mb-4">
                    <h2 className="text-lg font-bold text-[#f5f7ff] flex items-center gap-2">
                        <HardDriveDownload className="w-5 h-5 text-[#56ccf2]" />
                        Export & Publication
                    </h2>
                    <p className="text-sm text-[#9ba2c0]">Download project data for analysis, backup, or reporting.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Analyst Bundle */}
                    <button
                        onClick={handleAnalystBundle}
                        className="group flex flex-col items-start p-5 bg-[#11182b] border border-[#1d2440] hover:border-[#56ccf2] rounded-xl transition-all text-left"
                    >
                        <div className="p-3 bg-[#56ccf2]/10 rounded-lg mb-3 group-hover:scale-110 transition-transform">
                            <Archive className="w-6 h-6 text-[#56ccf2]" />
                        </div>
                        <h3 className="font-bold text-[#f5f7ff] mb-1">Analyst Bundle (ZIP)</h3>
                        <p className="text-xs text-[#9ba2c0] leading-relaxed">
                            Complete scientific package. Includes relational CSVs, GeoJSON maps, and metadata. Recommended for R/Python analysis.
                        </p>
                    </button>

                    {/* Raw JSON */}
                    <button
                        onClick={handleExportJSON}
                        className="group flex flex-col items-start p-5 bg-[#11182b] border border-[#1d2440] hover:border-[#f2c94c] rounded-xl transition-all text-left"
                    >
                        <div className="p-3 bg-[#f2c94c]/10 rounded-lg mb-3 group-hover:scale-110 transition-transform">
                            <FileJson className="w-6 h-6 text-[#f2c94c]" />
                        </div>
                        <h3 className="font-bold text-[#f5f7ff] mb-1">Full Backup (JSON)</h3>
                        <p className="text-xs text-[#9ba2c0] leading-relaxed">
                            Raw database dump. Use this for system restoration or migrating data to another device.
                        </p>
                    </button>

                    {/* Simple CSV */}
                    <button className="group flex flex-col items-start p-5 bg-[#11182b] border border-[#1d2440] hover:border-[#52d273] rounded-xl transition-all text-left">
                        <div className="p-3 bg-[#52d273]/10 rounded-lg mb-3 group-hover:scale-110 transition-transform">
                            <FileSpreadsheet className="w-6 h-6 text-[#52d273]" />
                        </div>
                        <h3 className="font-bold text-[#f5f7ff] mb-1">Summary Reports</h3>
                        <p className="text-xs text-[#9ba2c0] leading-relaxed">
                            Simplified Excel tables for quick viewing. Not recommended for complex analysis.
                        </p>
                    </button>
                </div>
            </section>

            {/* Section 2: Import & Migration */}
            <section>
                <div className="mb-4 pt-6 border-t border-[#1d2440]">
                    <h2 className="text-lg font-bold text-[#f5f7ff] flex items-center gap-2">
                        <UploadCloud className="w-5 h-5 text-[#a855f7]" />
                        Import Data
                    </h2>
                    <p className="text-sm text-[#9ba2c0]">Ingest legacy data or restore from backups.</p>
                </div>

                <div className="bg-[#11182b] border border-[#1d2440] rounded-xl p-6 flex flex-col md:flex-row items-center gap-6">
                    <div className="flex-1">
                        <h3 className="font-bold text-[#f5f7ff] mb-2">Legacy CSV Import Wizard</h3>
                        <p className="text-sm text-[#9ba2c0] mb-4">
                            Have old data in Excel? Our intelligent wizard can map your columns to the Aranya schema and reconstruct your plots automatically.
                        </p>
                        <button className="px-4 py-2 bg-[#a855f7] hover:bg-[#9333ea] text-white rounded-lg font-medium text-sm transition flex items-center gap-2">
                            <RefreshCw className="w-4 h-4" /> Launch Wizard
                        </button>
                    </div>

                    <div className="w-full md:w-1/3 border-2 border-dashed border-[#2d3748] hover:border-[#a855f7] rounded-xl h-32 flex flex-col items-center justify-center text-[#555b75] transition cursor-pointer">
                        <UploadCloud className="w-8 h-8 mb-2" />
                        <span className="text-xs font-medium">Drag & Drop files here</span>
                    </div>
                </div>
            </section>
        </div>
    );
};
