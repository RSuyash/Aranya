import React, { useState } from 'react';
import { X, Upload, ArrowRight, Database, CheckCircle, AlertTriangle, FileText } from 'lucide-react';
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
                    let match = MAPPING_TARGETS.PLOT.find(t => guessMapping([h], t.key));
                    if (!match) {
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

        // [Logic preserved from original file...]
        const plotsMap = new Map<string, InterchangePlot>();

        rawRows.forEach(row => {
            const plotCodeKey = Object.keys(columnMapping).find(k => columnMapping[k] === 'plotCode');
            if (!plotCodeKey) return;

            const code = row[plotCodeKey];
            if (!code) return;

            if (!plotsMap.has(code)) {
                const plotData: InterchangePlot = { plotCode: code, trees: [], customAttributes: {} };
                Object.entries(columnMapping).forEach(([header, target]) => {
                    if (target === 'surveyDate') plotData.surveyDate = row[header];
                    if (target === 'lat') plotData.lat = parseFloat(row[header]);
                    if (target === 'lng') plotData.lng = parseFloat(row[header]);
                    if (target === 'habitatType') plotData.habitatType = row[header];
                });
                plotsMap.set(code, plotData);
            }

            const plot = plotsMap.get(code)!;
            const treeTagKey = Object.keys(columnMapping).find(k => columnMapping[k] === 'tag');
            if (treeTagKey && row[treeTagKey]) {
                const tree: any = { customAttributes: {} };
                Object.entries(row).forEach(([header, value]) => {
                    const target = columnMapping[header];
                    if (target && typeof target === 'string' && ['tag', 'subplot', 'species', 'gbh', 'height', 'condition'].includes(target)) {
                        if (target === 'gbh' || target === 'height') tree[target] = typeof value === 'string' ? parseFloat(value) : (typeof value === 'number' ? value : 0);
                        else tree[target] = typeof value === 'string' ? value : JSON.stringify(value);
                    } else if (!target) {
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
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-panel border border-border rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-300">

                {/* Header */}
                <div className="p-6 border-b border-border flex justify-between items-center bg-panel-soft/50">
                    <h2 className="text-xl font-black text-text-main flex items-center gap-3 tracking-tight">
                        <Database className="w-5 h-5 text-warning" />
                        Data Ingest Wizard
                    </h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-panel-soft text-text-muted hover:text-text-main transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">

                    {step === 'UPLOAD' && (
                        <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-border rounded-2xl bg-panel-soft/30 hover:bg-panel-soft/60 transition-colors group cursor-pointer relative">
                            <input
                                type="file"
                                accept=".csv,.terx,.zip"
                                onChange={handleFileUpload}
                                className="absolute inset-0 opacity-0 cursor-pointer"
                            />
                            <div className="p-4 bg-panel border border-border rounded-2xl mb-4 group-hover:scale-110 transition-transform shadow-sm">
                                <Upload className="w-8 h-8 text-primary" />
                            </div>
                            <p className="text-text-main font-bold text-lg mb-1">Upload Source Data</p>
                            <p className="text-text-muted text-sm">Supports .csv (Max 5MB)</p>
                        </div>
                    )}

                    {step === 'CONTEXT' && (
                        <div className="space-y-6 max-w-lg mx-auto">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Target Project</label>
                                <select
                                    className="w-full bg-panel border border-border rounded-xl p-3 text-text-main focus:border-primary outline-none"
                                    value={targetProjectId}
                                    onChange={e => setTargetProjectId(e.target.value)}
                                >
                                    <option value="NEW">+ Create New Project</option>
                                    {projects?.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                            </div>

                            {targetProjectId === 'NEW' && (
                                <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                    <label className="text-xs font-bold text-text-muted uppercase tracking-wider">New Project Name</label>
                                    <input
                                        className="w-full bg-panel border border-border rounded-xl p-3 text-text-main focus:border-primary outline-none placeholder:text-text-muted/50"
                                        value={newProjectName}
                                        onChange={e => setNewProjectName(e.target.value)}
                                        placeholder="e.g. Warje Urban Forest Survey"
                                        autoFocus
                                    />
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Plot Protocol</label>
                                <select
                                    className="w-full bg-panel border border-border rounded-xl p-3 text-text-main focus:border-primary outline-none"
                                    value={blueprintId}
                                    onChange={e => setBlueprintId(e.target.value)}
                                >
                                    {PLOT_TEMPLATES.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                </select>
                                <p className="text-[10px] text-text-muted">Select the blueprint that matches your field method.</p>
                            </div>

                            <div className="pt-6 flex justify-end">
                                <button
                                    onClick={() => setStep('MAPPING')}
                                    className="bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-primary/20 transition-all active:scale-95"
                                >
                                    Next: Map Columns <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 'MAPPING' && (
                        <div className="space-y-6">
                            <div className="bg-warning/10 border border-warning/20 p-4 rounded-xl flex items-start gap-3">
                                <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
                                <div className="text-sm text-text-muted">
                                    <p className="font-bold text-warning mb-1">Schema Mapping</p>
                                    Map your CSV columns to the Terra system fields. Unmapped columns will be preserved as Custom Attributes.
                                </div>
                            </div>

                            <div className="space-y-3">
                                {rawHeaders.map(header => (
                                    <div key={header} className="flex items-center gap-4 bg-panel-soft p-3 rounded-xl border border-border group hover:border-primary/30 transition-colors">
                                        <div className="w-1/3 flex items-center gap-2">
                                            <FileText size={14} className="text-text-muted" />
                                            <span className="text-sm font-mono font-bold text-text-main truncate" title={header}>{header}</span>
                                        </div>
                                        <ArrowRight className="w-4 h-4 text-text-muted/30" />
                                        <select
                                            className="flex-1 bg-panel border border-border rounded-lg text-sm text-text-main p-2 focus:border-primary outline-none cursor-pointer"
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

                            <div className="pt-6 flex justify-end gap-3 border-t border-border mt-6">
                                <button onClick={() => setStep('CONTEXT')} className="text-text-muted hover:text-text-main px-4 font-medium transition-colors">Back</button>
                                <button onClick={runImport} className="bg-warning hover:bg-warning/90 text-black px-8 py-3 rounded-xl font-bold shadow-lg shadow-warning/20 transition-all active:scale-95">
                                    Start Import
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 'PROCESSING' && (
                        <div className="py-20 flex flex-col items-center">
                            <div className="w-16 h-16 border-4 border-panel-soft border-t-primary rounded-full animate-spin mb-6" />
                            <p className="text-text-main font-bold text-xl animate-pulse">Processing...</p>
                            <p className="text-text-muted text-sm mt-2">Validating taxonomy and timestamps</p>
                        </div>
                    )}

                    {step === 'DONE' && (
                        <div className="py-12 flex flex-col items-center text-center">
                            <div className="w-20 h-20 bg-success/10 text-success border border-success/20 rounded-full flex items-center justify-center mb-6 shadow-xl shadow-success/10">
                                <CheckCircle className="w-10 h-10" />
                            </div>
                            <h3 className="text-3xl font-black text-text-main mb-2 tracking-tight">Import Successful</h3>
                            <p className="text-text-muted max-w-md mx-auto mb-10 leading-relaxed">
                                Your data has been staged locally. Please review the "Pending" trees to resolve any unknown species.
                            </p>
                            <button onClick={onClose} className="bg-primary text-white px-10 py-3 rounded-xl font-bold hover:scale-105 transition-all shadow-lg shadow-primary/30">
                                Enter Workspace
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};