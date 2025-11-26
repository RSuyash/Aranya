import React from 'react';
import { X } from 'lucide-react';
import { DataManagementPanel } from './DataManagementPanel';

interface DataManagementModalProps {
    projectId: string;
    onClose: () => void;
}

export const DataManagementModal: React.FC<DataManagementModalProps> = ({ projectId, onClose }) => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-[#0b1020] border border-[#1d2440] rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl shadow-black/50 animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-[#1d2440] bg-[#0b1020]">
                    <div>
                        <h2 className="text-xl font-bold text-[#f5f7ff]">Data Management</h2>
                        <p className="text-sm text-[#9ba2c0]">Export datasets, manage backups, and import legacy data.</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-[#1d2440] rounded-lg transition-colors text-[#9ba2c0] hover:text-white"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 bg-[#050814]/50">
                    <DataManagementPanel projectId={projectId} />
                </div>
            </div>
        </div>
    );
};
