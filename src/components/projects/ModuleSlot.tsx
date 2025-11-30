import React, { useState } from 'react';
import { Settings, Power, Plus } from 'lucide-react';
import { clsx } from 'clsx';

interface ModuleSlotProps {
    title: string;
    description: string;
    icon: React.ComponentType<any>; // Icon component
    isActive: boolean;
    onInstall: () => void;
    onUninstall?: () => void;
    children?: React.ReactNode;
}

export const ModuleSlot: React.FC<ModuleSlotProps> = ({
    title, 
    description, 
    icon: Icon, 
    isActive, 
    onInstall, 
    onUninstall, 
    children
}) => {
    const [isConfigOpen, setIsConfigOpen] = useState(false);

    return (
        <div className={clsx(
            "relative overflow-hidden rounded-[24px] border transition-all duration-500 group",
            isActive
                ? "bg-panel border-primary/30 shadow-[0_0_40px_-10px_rgba(56,189,248,0.1)]"
                : "bg-panel/30 border-white/5 border-dashed hover:border-white/20 hover:bg-panel/50"
        )}>
            {/* Active Glow Strip */}
            {isActive && (
                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-primary to-blue-600" />
            )}

            {/* Header / Control Bar */}
            <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">

                {/* Identity Block */}
                <div className="flex items-start gap-5">
                    <div className={clsx(
                        "w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-inner shrink-0",
                        isActive
                            ? "bg-primary/10 text-primary border border-primary/20"
                            : "bg-white/5 text-text-muted border border-white/5 group-hover:scale-110 group-hover:text-text-main"
                    )}>
                        <Icon size={28} strokeWidth={1.5} />
                    </div>
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <h3 className={clsx("text-lg font-bold transition-colors", isActive ? "text-text-main" : "text-text-muted group-hover:text-text-main")}>
                                {title}
                            </h3>
                            {isActive && (
                                <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-success/10 border border-success/20 text-[10px] font-bold text-success uppercase tracking-wider shadow-[0_0_10px_rgba(34,197,94,0.2)]">
                                    <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                                    Online
                                </span>
                            )}
                        </div>
                        <p className="text-sm text-text-muted max-w-md leading-relaxed">
                            {description}
                        </p>
                    </div>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-3 self-end md:self-auto">
                    {isActive ? (
                        <>
                            <button
                                onClick={() => setIsConfigOpen(!isConfigOpen)}
                                className={clsx(
                                    "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all",
                                    isConfigOpen
                                        ? "bg-primary text-app shadow-lg shadow-primary/20 hover:bg-primary/90"
                                        : "bg-panel-soft border border-border text-text-muted hover:text-text-main hover:border-primary/50"
                                )}
                            >
                                <Settings size={16} />
                                {isConfigOpen ? 'Close Config' : 'Configure'}
                            </button>

                            {onUninstall && (
                                <button
                                    onClick={onUninstall}
                                    className="p-2.5 rounded-xl text-text-muted hover:text-danger hover:bg-danger/10 border border-transparent hover:border-danger/20 transition-all group/trash"
                                    title="Uninstall Module"
                                >
                                    <Power size={18} className="group-hover/trash:scale-110 transition-transform" />
                                </button>
                            )}
                        </>
                    ) : (
                        <button
                            onClick={onInstall}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-text-muted font-bold hover:bg-primary hover:text-app hover:border-primary hover:shadow-lg hover:shadow-primary/20 transition-all group/install"
                        >
                            <Plus size={18} className="group-hover/install:rotate-90 transition-transform" />
                            <span>Install Slot</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Configuration Drawer (Accordion) */}
            <div className={clsx(
                "border-t border-border bg-panel-soft/30 transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] overflow-hidden",
                isConfigOpen ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"
            )}>
                <div className="p-8">
                    {children}
                </div>
            </div>
        </div>
    );
};