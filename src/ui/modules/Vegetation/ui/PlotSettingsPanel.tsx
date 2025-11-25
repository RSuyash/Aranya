import React from 'react';
import { Grid3x3, TreeDeciduous, Tag } from 'lucide-react';
import type { PlotVisualizationSettings } from '../../../../core/data-model/types';
import { clsx } from 'clsx';

interface PlotSettingsPanelProps {
    settings: PlotVisualizationSettings;
    onSettingsChange: (settings: PlotVisualizationSettings) => void;
}

export const PlotSettingsPanel: React.FC<PlotSettingsPanelProps> = ({
    settings,
    onSettingsChange,
}) => {
    const toggleSetting = (key: keyof PlotVisualizationSettings) => {
        const currentValue = settings[key];
        if (typeof currentValue === 'boolean') {
            onSettingsChange({
                ...settings,
                [key]: !currentValue,
            });
        }
    };

    const SettingButton: React.FC<{
        icon: React.ReactNode;
        label: string;
        active: boolean;
        onClick: () => void;
    }> = ({ icon, label, active, onClick }) => (
        <button
            onClick={onClick}
            className={clsx(
                'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200',
                active
                    ? 'bg-[#52d273]/20 text-[#52d273] border border-[#52d273]/30'
                    : 'bg-[#1d2440]/50 text-[#9ba2c0] border border-[#1d2440] hover:border-[#555b75] hover:text-[#f5f7ff]'
            )}
            title={label}
        >
            {icon}
            <span className="hidden md:inline">{label}</span>
        </button>
    );

    return (
        <div className="flex items-center gap-2 px-3 py-1 bg-[#0b1020] border border-[#1d2440] rounded-lg flex-shrink-0">
            {/* Settings Label */}
            <div className="text-xs text-[#9ba2c0] font-medium hidden lg:block">
                Display:
            </div>

            {/* Show Subplots Toggle */}
            <SettingButton
                icon={<Grid3x3 className="w-4 h-4" />}
                label="Subplots"
                active={settings.showSubplots}
                onClick={() => toggleSetting('showSubplots')}
            />

            {/* Show Quadrant Lines Toggle */}
            <SettingButton
                icon={<Grid3x3 className="w-4 h-4" style={{ transform: 'rotate(45deg)' }} />}
                label="Quadrants"
                active={settings.showQuadrantLines}
                onClick={() => toggleSetting('showQuadrantLines')}
            />

            {/* Show Trees Toggle */}
            <SettingButton
                icon={<TreeDeciduous className="w-4 h-4" />}
                label="Trees"
                active={settings.showTreeVisualization}
                onClick={() => toggleSetting('showTreeVisualization')}
            />

            {/* Show Labels Toggle */}
            <SettingButton
                icon={<Tag className="w-4 h-4" />}
                label="Labels"
                active={settings.showLabels}
                onClick={() => toggleSetting('showLabels')}
            />
        </div>
    );
};
