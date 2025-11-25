import React from 'react';
import { ChartBar } from 'lucide-react';

export const EmptyState: React.FC<{ message?: string }> = ({
    message = "No data available for this selection"
}) => (
    <div className="flex flex-col items-center justify-center h-full w-full p-8 text-[#9ba2c0] border border-dashed border-[#1d2440] rounded-xl bg-[#0b1020]/30">
        <div className="p-4 bg-[#11182b] rounded-full mb-3">
            <ChartBar className="w-8 h-8 opacity-50" />
        </div>
        <p className="text-sm font-medium">{message}</p>
    </div>
);
