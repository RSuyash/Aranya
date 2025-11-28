import React from 'react';
import { Type, Hash } from 'lucide-react';

interface PlotBasicInfoFormProps {
    name: string;
    setName: (val: string) => void;
    code: string;
    setCode: (val: string) => void;
}

export const PlotBasicInfoForm: React.FC<PlotBasicInfoFormProps> = ({ name, setName, code, setCode }) => {
    return (
        <div className="space-y-5">
            {/* Plot Name Input */}
            <div className="group">
                <label className="block text-xs font-bold text-text-muted mb-2 uppercase tracking-wider group-focus-within:text-primary transition-colors">
                    Plot Name
                </label>
                <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors">
                        <Type className="w-5 h-5" />
                    </div>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Ridge Plot 1"
                        /* FIX: Removed /50 opacity from placeholder and text-muted */
                        className="w-full bg-panel border border-border rounded-xl pl-12 pr-4 py-4 text-text-main text-lg placeholder:text-text-muted placeholder:opacity-60 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all shadow-sm"
                        autoFocus
                    />
                </div>
            </div>

            {/* Plot Code Input */}
            <div className="group">
                <label className="block text-xs font-bold text-text-muted mb-2 uppercase tracking-wider group-focus-within:text-primary transition-colors">
                    Plot Code
                </label>
                <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors">
                        <Hash className="w-5 h-5" />
                    </div>
                    <input
                        type="text"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        placeholder="e.g. P-01"
                        /* FIX: Removed /50 opacity from placeholder */
                        className="w-full bg-panel border border-border rounded-xl pl-12 pr-4 py-4 text-text-main text-lg font-mono placeholder:text-text-muted placeholder:opacity-60 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all shadow-sm"
                    />
                </div>
            </div>
        </div>
    );
};