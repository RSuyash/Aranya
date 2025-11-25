import React from 'react';
import { CloudCheck, WarningOctagon, ArrowsClockwise } from 'phosphor-react';
import clsx from 'clsx';

type SyncState = 'SYNCED' | 'SYNCING' | 'OFFLINE' | 'ERROR';

export const SyncStatus: React.FC<{ status?: SyncState }> = ({ status = 'SYNCED' }) => {
    return (
        <div className={clsx(
            "flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all duration-300 backdrop-blur-md",
            status === 'SYNCED' && "bg-[#0b2214]/50 border-[#21452b] text-[#52d273]",
            status === 'SYNCING' && "bg-[#071824]/50 border-[#15324b] text-[#56ccf2]",
            status === 'OFFLINE' && "bg-[#1d2440]/50 border-[#1d2440] text-[#9ba2c0]",
            status === 'ERROR' && "bg-[#2a1215]/50 border-[#4a1d21] text-[#ff7e67]"
        )}>
            {status === 'SYNCED' && <CloudCheck size={14} weight="fill" />}
            {status === 'SYNCING' && <ArrowsClockwise size={14} className="animate-spin" />}
            {status === 'OFFLINE' && <WarningOctagon size={14} weight="fill" />}

            <span className="text-[10px] font-bold uppercase tracking-wider">
                {status === 'SYNCED' && "Synced"}
                {status === 'SYNCING' && "Syncing..."}
                {status === 'OFFLINE' && "Offline Mode"}
                {status === 'ERROR' && "Sync Error"}
            </span>
        </div>
    );
};