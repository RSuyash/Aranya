import React, { useState, useRef, useEffect } from 'react';
import {
    MoreVertical,
    Grid3x3,
    TreeDeciduous,
    Tag,
    Check,
    Square
} from 'lucide-react';
import type { PlotVisualizationSettings } from '../../../../core/data-model/types';
import { clsx } from 'clsx';

interface PlotSettingsMenuProps {
    settings: PlotVisualizationSettings;
    onSettingsChange: (settings: PlotVisualizationSettings) => void;
}

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

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const toggleSetting = (key: keyof PlotVisualizationSettings) => {
        const currentValue = settings[key];
        if (typeof currentValue === 'boolean') {
            onSettingsChange({
                ...settings,
                [key]: !currentValue,
            });
        }
    };

    const MenuItem: React.FC<{
        icon: React.ReactNode;
        label: string;
        checked: boolean;
        onClick: () => void;
    }> = ({ icon, label, checked, onClick }) => (
        <button
            onClick={onClick}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-[#f5f7ff] hover:bg-[#1d2440] transition-colors text-left group"
        >
            <div className={clsx(
                "w-5 h-5 rounded flex items-center justify-center border transition-colors",
                checked
                    ? "bg-[#52d273] border-[#52d273] text-[#050814]"
                    : "border-[#555b75] group-hover:border-[#9ba2c0]"
            )}>
                {checked && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
            </div>
            <span className="flex-1 font-medium">{label}</span>
            <div className="text-[#555b75] group-hover:text-[#9ba2c0]">
                {icon}
            </div>
        </button>
    );

    return (
        <div className="relative flex-shrink-0" ref={menuRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={clsx(
                    "flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200",
                    isOpen
                        ? "bg-[#52d273] text-[#050814]"
                        : "bg-[#1d2440] text-[#9ba2c0] hover:text-[#f5f7ff] hover:bg-[#2a3454]"
                )}
                title="Visualization Settings"
            >
                <MoreVertical className="w-5 h-5" />
            </button>

            {isOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-[#0b1020] border border-[#1d2440] rounded-xl shadow-xl shadow-black/50 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-100 origin-top-right">
                    <div className="px-3 py-2 border-b border-[#1d2440]">
                        <span className="text-xs font-bold text-[#555b75] uppercase tracking-wider">
                            View Options
                        </span>
                    </div>

                    <div className="py-1">
                        <MenuItem
                            icon={<Grid3x3 className="w-4 h-4" />}
                            label="Show Quadrants"
                            checked={settings.showQuadrants}
                            onClick={() => toggleSetting('showQuadrants')}
                        />
                        <MenuItem
                            icon={<Square className="w-4 h-4" />}
                            label="Show Subplots"
                            checked={settings.showSubplots}
                            onClick={() => toggleSetting('showSubplots')}
                        />
                        <MenuItem
                            icon={<Grid3x3 className="w-4 h-4 rotate-45" />}
                            label="Quadrant Lines"
                            checked={settings.showQuadrantLines}
                            onClick={() => toggleSetting('showQuadrantLines')}
                        />
                        <MenuItem
                            icon={<TreeDeciduous className="w-4 h-4" />}
                            label="Show Trees"
                            checked={settings.showTreeVisualization}
                            onClick={() => toggleSetting('showTreeVisualization')}
                        />
                        <MenuItem
                            icon={<Tag className="w-4 h-4" />}
                            label="Show Labels"
                            checked={settings.showLabels}
                            onClick={() => toggleSetting('showLabels')}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};
