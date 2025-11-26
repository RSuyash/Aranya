import React, { useState } from 'react';
import { X, Upload, ArrowRight, Database, CheckCircle, AlertTriangle } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../core/data-model/dexie';
import { parseCSV, guessMapping } from '../../utils/sync/csvParser';
import { MAPPING_TARGETS } from '../../utils/sync/interchangeSchema';
import type { InterchangeProject, InterchangePlot } from '../../utils/sync/interchangeSchema';
import { ImportWizardController } from '../../utils/sync/ImportWizardController';
import { PLOT_TEMPLATES } from '../../ui/modules/Vegetation/data/plotTemplates';

interface Props {
    onClose: () => void;
    currentUserId: string;
}

type Step = 'UPLOAD' | 'CONTEXT' | 'MAPPING' | 'REVIEW' | 'PROCESSING' | 'DONE';

export const ImportWizardModal: React.FC<Props> = ({ onClose, currentUserId }) => {
    const [step, setStep] = useState<Step>('UPLOAD');
    const [file, setFile] = useState<File | null>(null);
    const [rawHeaders, setRawHeaders] = useState<string[]>([]);
    const [rawRows, setRawRows] = useState<any[]>([]);

    // Context State
    const [targetProjectId, setTargetProjectId] = useState<string>('NEW');
    const [newProjectName, setNewProjectName] = useState('');
    const [blueprintId, setBlueprintId] = useState('std-20x20-4q');

    // Mapping State: { "CSV_Header": "Schema_Key" }
    const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});

    // Queries
    const projects = useLiveQuery(() => db.projects.toArray()) || [];

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            const f = e.target.files[0];
            setFile(f);
            try {
                const { headers, rows } = await parseCSV(f);
                setRawHeaders(headers);
                setRawRows(rows);
                setStep('CONTEXT');

                // Auto-guess mapping
                const initialMap: Record<string, string> = {};
                headers.forEach(h => {
                    // Check Plot Targets
                    let match = MAPPING_TARGETS.PLOT.find(t => guessMapping([h], t.key));
                    if (!match) {
                        // Check Tree Targets
                        match = MAPPING_TARGETS.TREE.find(t => guessMapping([h], t.key));
                    }
                    if (match) initialMap[h] = match.key;
                });
                setColumnMapping(initialMap);

            } catch (err) {
                alert("Error parsing CSV");
            }
        }
    };

    const runImport = async () => {
        setStep('PROCESSING');

        // 1. Transform Raw Rows -> Interchange Schema
        const plotsMap = new Map<string, InterchangePlot>();

        rawRows.forEach(row => {
            // Find the Plot Code (Natural Key)
            const plotCodeKey = Object.keys(columnMapping).find(k => columnMapping[k] === 'plotCode');
            if (!plotCodeKey) return; // Skip rows without plot code

            const code = row[plotCodeKey];
            if (!code) return;

            if (!plotsMap.has(code)) {
                // Extract Plot Level Data
                const plotData: InterchangePlot = { plotCode: code, trees: [], customAttributes: {} };

                // Map fields
                Object.entries(columnMapping).forEach(([header, target]) => {
                    if (target === 'surveyDate') plotData.surveyDate = row[header];
                    if (target === 'lat') plotData.lat = parseFloat(row[header]);
                    if (target === 'lng') plotData.lng = parseFloat(row[header]);
                    if (target === 'habitatType') plotData.habitatType = row[header];

                    // Preserve unmapped plot-level data if needed? 
                    // For simplicity, we dump unmapped cols into tree or plot depending on context
                });

                plotsMap.set(code, plotData);
            }

            const plot = plotsMap.get(code)!;

            // Extract Tree Data
            const treeTagKey = Object.keys(columnMapping).find(k => columnMapping[k] === 'tag');
            if (treeTagKey && row[treeTagKey]) {
                const tree: any = { customAttributes: {} };

                Object.entries(row).forEach(([header, value]) => {
                    const target = columnMapping[header];
                    if (target && typeof target === 'string' && ['tag', 'subplot', 'species', 'gbh', 'height', 'condition'].includes(target)) {
                        if (target === 'gbh' || target === 'height') tree[target] = typeof value === 'string' ? parseFloat(value) : (typeof value === 'number' ? value : 0);
                        else tree[target] = typeof value === 'string' ? value : JSON.stringify(value);
                    } else if (!target) {
                        // Unmapped -> Custom Attribute
                        tree.customAttributes[header] = value;
                    }
                });

                plot.trees?.push(tree);
            }
        });

        const interchangeData: InterchangeProject = {
            projectName: newProjectName || (file && typeof file.name === 'string' ? file.name.replace('.csv', '') : "Imported"),
            plots: Array.from(plotsMap.values())
        };

        // 2. Execute
        const controller = new ImportWizardController();
        await controller.runImport(interchangeData, {
            targetProjectId,
            newProjectName,
            selectedBlueprintId: blueprintId,
            currentUserId
        });

        setStep('DONE');
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
            <div className="bg-[#0b1020] border border-[#1d2440] rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">

                {/* Header */}
                <div className="p-6 border-b border-[#1d2440] flex justify-between items-center">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Database className="w-5 h-5 text-[#f2c94c]" />
                        Import Data Wizard
                    </h2>
                    <button onClick={onClose}><X className="text-gray-400 hover:text-white" /></button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">

                    {step === 'UPLOAD' && (
                        <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-[#1d2440] rounded-xl bg-[#0f1629]">
                            <Upload className="w-12 h-12 text-[#f2c94c] mb-4" />
                            <p className="text-gray-300 mb-2 font-medium">Upload your Vegetation CSV</p>
                            <p className="text-gray-500 text-sm mb-6">Supports .csv (Max 5MB)</p>
                            <input type="file" accept=".csv,.terx,.zip" onChange={handleFileUpload} className="text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-[#1d2440] file:text-[#f2c94c] hover:file:bg-[#2a3454]" />
                        </div>
                    )}

                    {step === 'CONTEXT' && (
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm text-gray-400">Target Project</label>
                                <select
                                    className="w-full bg-[#050814] border border-[#1d2440] rounded-lg p-3 text-white"
                                    value={targetProjectId}
                                    onChange={e => setTargetProjectId(e.target.value)}
                                >
                                    <option value="NEW">+ Create New Project</option>
                                    {projects?.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                            </div>

                            {targetProjectId === 'NEW' && (
                                <div className="space-y-2">
                                    <label className="text-sm text-gray-400">New Project Name</label>
                                    <input
                                        className="w-full bg-[#050814] border border-[#1d2440] rounded-lg p-3 text-white"
                                        value={newProjectName}
                                        onChange={e => setNewProjectName(e.target.value)}
                                        placeholder="e.g. Warje Urban Forest Survey"
                                    />
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="text-sm text-gray-400">Plot Blueprint (Protocol)</label>
                                <select
                                    className="w-full bg-[#050814] border border-[#1d2440] rounded-lg p-3 text-white"
                                    value={blueprintId}
                                    onChange={e => setBlueprintId(e.target.value)}
                                >
                                    {PLOT_TEMPLATES.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                </select>
                                <p className="text-xs text-[#9ba2c0]">Select the blueprint that matches your field method (e.g. 20x20m).</p>
                            </div>

                            <div className="pt-4 flex justify-end">
                                <button onClick={() => setStep('MAPPING')} className="bg-[#f2c94c] text-black px-6 py-2 rounded-lg font-bold flex items-center gap-2">
                                    Next: Map Columns <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 'MAPPING' && (
                        <div>
                            <div className="bg-[#1d2440]/50 p-4 rounded-lg mb-6 flex items-start gap-3">
                                <AlertTriangle className="w-5 h-5 text-[#f2c94c] shrink-0 mt-0.5" />
                                <div className="text-sm text-gray-300">
                                    <p className="font-bold text-white mb-1">Mapping Instructions</p>
                                    Map your CSV columns to the system fields. Any unmapped column will be saved as a "Custom Attribute" so no data is lost.
                                </div>
                            </div>

                            <div className="space-y-2">
                                {rawHeaders.map(header => (
                                    <div key={header} className="flex items-center gap-4 bg-[#050814] p-3 rounded-lg border border-[#1d2440]">
                                        <div className="w-1/3 text-sm font-mono text-gray-300 truncate" title={header}>{header}</div>
                                        <ArrowRight className="w-4 h-4 text-gray-600" />
                                        <select
                                            className="flex-1 bg-[#11182b] border border-[#1d2440] rounded text-sm text-white p-2"
                                            value={columnMapping[header] || ''}
                                            onChange={(e) => setColumnMapping({ ...columnMapping, [header]: e.target.value })}
                                        >
                                            <option value="">(Save as Custom Attribute)</option>
                                            <optgroup label="Plot Data">
                                                {MAPPING_TARGETS.PLOT.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
                                            </optgroup>
                                            <optgroup label="Tree Data">
                                                {MAPPING_TARGETS.TREE.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
                                            </optgroup>
                                        </select>
                                    </div>
                                ))}
                            </div>

                            <div className="pt-6 flex justify-end gap-3">
                                <button onClick={() => setStep('CONTEXT')} className="text-gray-400 hover:text-white px-4">Back</button>
                                <button onClick={runImport} className="bg-[#f2c94c] text-black px-6 py-2 rounded-lg font-bold">
                                    Start Import
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 'PROCESSING' && (
                        <div className="py-20 flex flex-col items-center">
                            <div className="w-12 h-12 border-4 border-[#1d2440] border-t-[#f2c94c] rounded-full animate-spin mb-4" />
                            <p className="text-white font-medium">Importing Data...</p>
                            <p className="text-gray-500 text-sm">Validating taxonomy and timestamps</p>
                        </div>
                    )}

                    {step === 'DONE' && (
                        <div className="py-12 flex flex-col items-center text-center">
                            <div className="w-16 h-16 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mb-6">
                                <CheckCircle className="w-8 h-8" />
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-2">Import Successful!</h3>
                            <p className="text-gray-400 max-w-md mx-auto mb-8">
                                Your data has been staged locally. Please review the "Pending" trees to resolve any unknown species.
                            </p>
                            <button onClick={onClose} className="bg-[#f2c94c] text-black px-8 py-3 rounded-xl font-bold">
                                View Project
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
