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
        <div className="space-y-4">
            <div className="group">
                <label className="block text-xs font-bold text-[#9ba2c0] mb-2 uppercase tracking-wider group-focus-within:text-[#56ccf2] transition-colors">
                    Plot Name
                </label>
                <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#555b75] group-focus-within:text-[#56ccf2] transition-colors">
                        <Type className="w-5 h-5" />
                    </div>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Ridge Plot 1"
                        className="w-full bg-[#0b1020] border border-[#1d2440] rounded-xl pl-12 pr-4 py-4 text-[#f5f7ff] text-lg placeholder:text-[#555b75] focus:border-[#56ccf2] focus:bg-[#11182b] focus:ring-1 focus:ring-[#56ccf2] outline-none transition-all"
                        autoFocus
                    />
                </div>
            </div>

            <div className="group">
                <label className="block text-xs font-bold text-[#9ba2c0] mb-2 uppercase tracking-wider group-focus-within:text-[#56ccf2] transition-colors">
                    Plot Code
                </label>
                <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#555b75] group-focus-within:text-[#56ccf2] transition-colors">
                        <Hash className="w-5 h-5" />
                    </div>
                    <input
                        type="text"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        placeholder="e.g. P-01"
                        className="w-full bg-[#0b1020] border border-[#1d2440] rounded-xl pl-12 pr-4 py-4 text-[#f5f7ff] text-lg font-mono placeholder:text-[#555b75] focus:border-[#56ccf2] focus:bg-[#11182b] focus:ring-1 focus:ring-[#56ccf2] outline-none transition-all"
                    />
                </div>
            </div>
        </div>
    );
};
