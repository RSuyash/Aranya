import React from 'react';
import { Cloud, CloudOff, RefreshCw, AlertTriangle } from 'lucide-react';
import clsx from 'clsx';

type SyncState = 'SYNCED' | 'SYNCING' | 'OFFLINE' | 'ERROR';

export const SyncStatus: React.FC<{ status?: SyncState }> = ({ status = 'SYNCED' }) => {
    return (
        <div className={clsx(
            "flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all duration-500 backdrop-blur-md",
            status === 'SYNCED' && "bg-success/10 border-success/20 text-success",
            status === 'SYNCING' && "bg-primary/10 border-primary/20 text-primary",
            status === 'OFFLINE' && "bg-panel-soft border-border text-text-muted",
            status === 'ERROR' && "bg-danger/10 border-danger/20 text-danger"
        )}>
            {status === 'SYNCED' && <Cloud size={14} strokeWidth={2.5} />}
            {status === 'SYNCING' && <RefreshCw size={14} className="animate-spin" />}
            {status === 'OFFLINE' && <CloudOff size={14} />}
            {status === 'ERROR' && <AlertTriangle size={14} />}

            <span className="text-[9px] font-bold uppercase tracking-widest">
                {status === 'SYNCED' && "Synced"}
                {status === 'SYNCING' && "Syncing..."}
                {status === 'OFFLINE' && "Offline"}
                {status === 'ERROR' && "Sync Error"}
            </span>
        </div>
    );
};