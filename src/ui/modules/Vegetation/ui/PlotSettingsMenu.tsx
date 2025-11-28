import React, { useState, useRef, useEffect } from 'react';
import {
    Layers,
    Grid3x3,
    TreeDeciduous,
    Type,
    Maximize,
    Settings2,
    ScanLine
} from 'lucide-react';
import type { PlotVisualizationSettings } from '../../../../core/data-model/types';
import { clsx } from 'clsx';

interface PlotSettingsMenuProps {
    settings: PlotVisualizationSettings;
    onSettingsChange: (settings: PlotVisualizationSettings) => void;
}

// --- SUB-COMPONENT: CYBER SWITCH ---
const CyberSwitch = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
    <button
        onClick={(e) => { e.stopPropagation(); onChange(); }}
        className={clsx(
            "relative w-10 h-5 rounded-full transition-all duration-300 ease-out flex items-center shadow-inner",
            checked ? "bg-primary/20 border border-primary/50" : "bg-panel-soft border border-border"
        )}
    >
        {/* The Track Glow */}
        <div className={clsx(
            "absolute inset-0 rounded-full transition-opacity duration-300",
            checked ? "opacity-100 shadow-[0_0_10px_var(--primary)]" : "opacity-0"
        )} />

        {/* The Thumb */}
        <div
            className={clsx(
                "absolute w-3 h-3 rounded-full shadow-sm transition-all duration-300 transform",
                checked ? "translate-x-6 bg-primary" : "translate-x-1 bg-text-muted"
            )}
        />
    </button>
);

export const PlotSettingsMenu: React.FC<PlotSettingsMenuProps> = ({
    settings,
    onSettingsChange,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        if (isOpen) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const toggle = (key: keyof PlotVisualizationSettings) => {
        onSettingsChange({ ...settings, [key]: !settings[key] });
    };

    // Count active layers for the badge
    const activeCount = Object.values(settings).filter(v => v === true).length;

    const SettingRow = ({
        icon: Icon,
        label,
        desc,
        settingKey
    }: {
        icon: any;
        label: string;
        desc: string;
        settingKey: keyof PlotVisualizationSettings;
    }) => {
        const isActive = !!settings[settingKey];
        return (
            <div
                onClick={() => toggle(settingKey)}
                className={clsx(
                    "flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all duration-200 group border border-transparent",
                    isActive
                        ? "bg-primary/5 border-primary/10"
                        : "hover:bg-panel-soft hover:border-border"
                )}
            >
                <div className="flex items-center gap-3">
                    <div className={clsx(
                        "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                        isActive ? "bg-primary/20 text-primary" : "bg-panel-soft text-text-muted group-hover:text-text-main"
                    )}>
                        <Icon size={16} strokeWidth={isActive ? 2.5 : 2} />
                    </div>
                    <div>
                        <div className={clsx("text-xs font-bold transition-colors", isActive ? "text-text-main" : "text-text-muted group-hover:text-text-main")}>
                            {label}
                        </div>
                        <div className="text-[10px] text-text-muted/70 font-medium">
                            {desc}
                        </div>
                    </div>
                </div>
                <CyberSwitch checked={isActive} onChange={() => toggle(settingKey)} />
            </div>
        );
    };

    return (
        <div className="relative z-50" ref={menuRef}>
            {/* Trigger Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={clsx(
                    "relative flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all duration-300",
                    isOpen
                        ? "bg-panel border-primary text-primary shadow-[0_0_15px_rgba(var(--primary),0.2)]"
                        : "bg-panel-soft border-border text-text-muted hover:text-text-main hover:border-primary/50"
                )}
            >
                <Layers size={16} className={isOpen ? "animate-[spin_1s_ease-out]" : ""} />
                <span className="text-xs font-bold tracking-wide hidden sm:inline">Layers</span>

                {/* Active Count Badge */}
                {activeCount > 0 && !isOpen && (
                    <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-bg-app border-2 border-bg-app">
                        {activeCount}
                    </span>
                )}
            </button>

            {/* Floating Control Panel */}
            {isOpen && (
                <div className="absolute right-0 top-full mt-3 w-72 origin-top-right animate-in fade-in zoom-in-95 duration-200">
                    <div className="bg-panel/95 backdrop-blur-xl border border-border rounded-2xl shadow-2xl overflow-hidden ring-1 ring-black/5">

                        {/* Header */}
                        <div className="px-4 py-3 border-b border-border bg-panel-soft/50 flex justify-between items-center">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted flex items-center gap-2">
                                <Settings2 size={12} /> View Configuration
                            </span>
                            <span className="text-[10px] font-mono text-primary bg-primary/10 px-1.5 rounded">
                                {activeCount} Active
                            </span>
                        </div>

                        <div className="p-2 space-y-1">
                            {/* Section: Structure */}
                            <div className="px-2 py-1.5">
                                <span className="text-[9px] font-bold text-text-muted/50 uppercase tracking-wider ml-1">Grid & Geometry</span>
                            </div>

                            <SettingRow
                                icon={Grid3x3}
                                label="Quadrants"
                                desc="2x2 Primary Grid"
                                settingKey="showQuadrants"
                            />
                            <SettingRow
                                icon={Maximize}
                                label="Subplots"
                                desc="Nested Sampling Units"
                                settingKey="showSubplots"
                            />
                            <SettingRow
                                icon={ScanLine}
                                label="Grid Lines"
                                desc="Visual Boundary Guides"
                                settingKey="showQuadrantLines"
                            />

                            {/* Divider */}
                            <div className="h-px bg-border/50 mx-2 my-1" />

                            {/* Section: Data */}
                            <div className="px-2 py-1.5">
                                <span className="text-[9px] font-bold text-text-muted/50 uppercase tracking-wider ml-1">Data Overlay</span>
                            </div>

                            <SettingRow
                                icon={TreeDeciduous}
                                label="Biomass"
                                desc="Tree Locations & GBH"
                                settingKey="showTreeVisualization"
                            />
                            <SettingRow
                                icon={Type}
                                label="Labels"
                                desc="Unit Identifiers"
                                settingKey="showLabels"
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};