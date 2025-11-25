import React, { useState } from 'react';
import { Button } from '../components/ui/Button';
import { verifyDatabaseIntegrity, generateTestData } from '../utils/verification';
import { CheckCircle, WarningCircle } from 'phosphor-react';
import { useNavigate } from 'react-router-dom';

export const SettingsPage: React.FC = () => {
    const [logs, setLogs] = useState<string[]>([]);
    const navigate = useNavigate();

    const handleVerify = async () => {
        setLogs(['Running verification...']);
        const results = await verifyDatabaseIntegrity();
        setLogs(results);
    };

    const handleGenerateData = async () => {
        try {
            const projectId = await generateTestData();
            alert('Test Project Generated! Redirecting...');
            navigate(`/projects/${projectId}`);
        } catch (error) {
            console.error(error);
            alert('Failed to generate data');
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-8">
            <div>
                <h2 className="text-2xl font-bold text-text-main">System Settings</h2>
                <p className="text-text-muted">App configuration and diagnostics.</p>
            </div>

            <div className="glass-panel p-6 rounded-xl space-y-4">
                <h3 className="text-lg font-semibold">Database Diagnostics</h3>
                <p className="text-sm text-text-muted">
                    Run a self-test to verify that the offline database is reading and writing correctly.
                </p>

                <div className="flex gap-4">
                    <Button onClick={handleVerify} variant="secondary">
                        Run System Verification
                    </Button>
                    <Button onClick={handleGenerateData} variant="primary">
                        Generate Test Data
                    </Button>
                </div>

                {logs.length > 0 && (
                    <div className="mt-4 p-4 bg-bg-app rounded-lg border border-border space-y-2 font-mono text-sm">
                        {logs.map((log, i) => (
                            <div key={i} className="flex items-center gap-2">
                                {log.includes('✅') ? (
                                    <CheckCircle className="text-success" size={16} />
                                ) : (
                                    <WarningCircle className="text-danger" size={16} />
                                )}
                                <span>{log.replace('✅ ', '').replace('❌ ', '')}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
