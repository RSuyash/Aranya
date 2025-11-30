import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useHeader } from '../context/HeaderContext';
import { Button } from '../components/ui/Button';
import { verifyDatabaseIntegrity, generateTestData } from '../utils/verification';
import {
    CheckCircle2, AlertTriangle, Terminal,
    Database, Activity, Server, Shield
} from 'lucide-react';
import { clsx } from 'clsx';

export const SettingsPage: React.FC = () => {
    const [logs, setLogs] = useState<{ msg: string, type: 'success' | 'error' | 'info' }[]>([]);
    const navigate = useNavigate();
    const { setHeader } = useHeader();

    useEffect(() => {
        setHeader({
            title: 'System Firmware',
            breadcrumbs: [
                { label: 'Terra', path: '/' },
                { label: 'Settings', path: '/settings' }
            ],
            moduleColor: 'violet',
            isLoading: false
        });
    }, [setHeader]);

    const handleVerify = async () => {
        setLogs([{ msg: 'Initializing integrity protocols...', type: 'info' }]);
        const results = await verifyDatabaseIntegrity();
        const formattedLogs = results.map(r => ({
            msg: r.replace('✅ ', '').replace('❌ ', ''),
            type: r.includes('✅') ? 'success' as const : 'error' as const
        }));
        setLogs(prev => [...prev, ...formattedLogs]);
    };

    const handleGenerateData = async () => {
        try {
            setLogs(prev => [...prev, { msg: 'Generating synthetic dataset...', type: 'info' }]);
            const projectId = await generateTestData();
            alert('Simulation Complete. Redirecting to Project Sector.');
            navigate(`/projects/${projectId}`);
        } catch (error) {
            console.error(error);
            setLogs(prev => [...prev, { msg: 'Generation failed.', type: 'error' }]);
        }
    };

    return (
        <div className="max-w-3xl mx-auto space-y-8 pb-20 animate-in fade-in duration-500">

            {/* Header */}
            <div className="flex items-center gap-4 border-b border-border pb-6">
                <div className="p-3 bg-primary/10 rounded-2xl text-primary border border-primary/20">
                    <Shield size={24} />
                </div>
                <div>
                    <h2 className="text-2xl font-black text-text-main tracking-tight">System Core</h2>
                    <p className="text-text-muted">Local database diagnostics and developer tools.</p>
                </div>
            </div>

            {/* Diagnostics Console */}
            <div className="bg-panel border border-border rounded-3xl overflow-hidden shadow-lg">
                <div className="p-6 border-b border-border bg-panel-soft/30 flex items-center justify-between">
                    <h3 className="font-bold text-text-main flex items-center gap-2">
                        <Terminal size={18} className="text-warning" />
                        Diagnostic Console
                    </h3>
                    <div className="flex items-center gap-2 text-[10px] font-mono text-text-muted uppercase tracking-widest">
                        <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
                        Ready
                    </div>
                </div>

                <div className="p-8 space-y-6">
                    <p className="text-sm text-text-muted leading-relaxed">
                        Run a self-test to verify that the offline <code>IndexedDB</code> storage is reading and writing correctly.
                        This process will create temporary records and verify their persistence.
                    </p>

                    <div className="flex flex-wrap gap-4">
                        <Button
                            onClick={handleVerify}
                            variant="secondary"
                            leftIcon={<Activity size={16} />}
                        >
                            Run Integrity Check
                        </Button>
                        <Button
                            onClick={handleGenerateData}
                            className="bg-panel border border-dashed border-border hover:border-primary text-text-muted hover:text-primary"
                            leftIcon={<Database size={16} />}
                        >
                            Generate Test Data
                        </Button>
                    </div>

                    {/* Output Terminal */}
                    {logs.length > 0 && (
                        <div className="mt-6 rounded-xl bg-app border border-border overflow-hidden font-mono text-xs shadow-inner">
                            <div className="bg-panel-soft px-4 py-2 border-b border-border text-text-muted flex justify-between">
                                <span>OUTPUT.LOG</span>
                                <span>{new Date().toLocaleTimeString()}</span>
                            </div>
                            <div className="p-4 space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
                                {logs.map((log, i) => (
                                    <div key={i} className="flex items-start gap-3">
                                        <div className="mt-0.5 shrink-0">
                                            {log.type === 'success' && <CheckCircle2 size={14} className="text-success" />}
                                            {log.type === 'error' && <AlertTriangle size={14} className="text-danger" />}
                                            {log.type === 'info' && <Server size={14} className="text-primary" />}
                                        </div>
                                        <span className={clsx(
                                            log.type === 'success' ? "text-success" :
                                                log.type === 'error' ? "text-danger" :
                                                    "text-text-main"
                                        )}>
                                            {log.msg}
                                        </span>
                                    </div>
                                ))}
                                <div className="animate-pulse text-primary">_</div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};