import React, { useState, useEffect } from 'react';
import { Settings2, LayoutGrid, Maximize, AlertCircle, BookTemplate } from 'lucide-react';
import { clsx } from 'clsx';
import type { PlotConfiguration, SubplotRule } from '../../../../core/plot-engine/types';
import { PLOT_TEMPLATES } from '../data/plotTemplates';

interface PlotConfiguratorProps {
    onChange: (config: PlotConfiguration) => void;
    initialConfig?: PlotConfiguration;
}

export const PlotConfigurator: React.FC<PlotConfiguratorProps> = ({ onChange, initialConfig }) => {
    // Default State
    const [selectedTemplateId, setSelectedTemplateId] = useState<string>('custom');
    const [width, setWidth] = useState(initialConfig?.dimensions.width || 20);
    const [length, setLength] = useState(initialConfig?.dimensions.length || 20);
    const [useQuadrants, setUseQuadrants] = useState(initialConfig?.grid.enabled ?? true);
    const [useSubplots, setUseSubplots] = useState(initialConfig?.subplots.enabled ?? true);
    const [subplotSize, setSubplotSize] = useState(1); // 1x1m default
    const [subplotPlacement, setSubplotPlacement] = useState<'CORNER' | 'CENTER'>('CORNER');
    const [excludeCanopy, setExcludeCanopy] = useState(false);

    // Apply Template
    const applyTemplate = (templateId: string) => {
        setSelectedTemplateId(templateId);
        const template = PLOT_TEMPLATES.find(t => t.id === templateId);
        if (!template) return;

        const config = template.config;

        // Map config back to UI state
        setWidth(config.dimensions.width);
        setLength(config.dimensions.length);
        setUseQuadrants(config.grid.enabled);
    };

    // Effect to propagate changes
    useEffect(() => {
        const config: PlotConfiguration = {
            shape: 'RECTANGLE',
            dimensions: { width, length },
            grid: {
                enabled: useQuadrants,
                rows: 2,
                cols: 2,
                labelStyle: 'Q1-Q4'
            },
            subplots: {
                enabled: useSubplots,
                rules: []
            },
            rules: {
                minInterTreeDistance: 0.5
            }
        };

        if (useSubplots) {
            const rules: SubplotRule[] = [];
            const dims = { width: subplotSize, length: subplotSize };

            if (subplotPlacement === 'CORNER') {
                // Add 4 corner subplots
                rules.push(
                    { type: 'fixed', shape: 'RECTANGLE', dimensions: dims, position: 'CORNER_SW', strata: ['HERB'], excludesCanopy: excludeCanopy },
                    { type: 'fixed', shape: 'RECTANGLE', dimensions: dims, position: 'CORNER_SE', strata: ['HERB'], excludesCanopy: excludeCanopy },
                    { type: 'fixed', shape: 'RECTANGLE', dimensions: dims, position: 'CORNER_NW', strata: ['HERB'], excludesCanopy: excludeCanopy },
                    { type: 'fixed', shape: 'RECTANGLE', dimensions: dims, position: 'CORNER_NE', strata: ['HERB'], excludesCanopy: excludeCanopy }
                );
            } else if (subplotPlacement === 'CENTER') {
                // Add 1 center subplot
                rules.push(
                    { type: 'fixed', shape: 'RECTANGLE', dimensions: dims, position: 'CENTER', strata: ['HERB'], excludesCanopy: excludeCanopy }
                );
            }
            config.subplots.rules = rules;
        }

        onChange(config);
    }, [width, length, useQuadrants, useSubplots, subplotSize, subplotPlacement, excludeCanopy, onChange]);

    // Watch for manual changes to reset template selection to 'custom'
    const handleManualChange = (setter: (val: any) => void, val: any) => {
        setter(val);
        setSelectedTemplateId('custom');
    };

    return (
        <div className="space-y-6 bg-[#0b1020] p-4 rounded-xl border border-[#1d2440]">
            {/* Header */}
            <div className="flex items-center gap-2 text-[#f5f7ff] border-b border-[#1d2440] pb-3">
                <Settings2 className="w-5 h-5 text-[#56ccf2]" />
                <h3 className="font-semibold">Plot Configuration</h3>
            </div>

            {/* Templates */}
            <div className="space-y-3">
                <label className="text-xs font-medium text-[#9ba2c0] uppercase tracking-wide flex items-center gap-2">
                    <BookTemplate className="w-3.5 h-3.5" />
                    Templates
                </label>
                <select
                    value={selectedTemplateId}
                    onChange={(e) => applyTemplate(e.target.value)}
                    className="w-full bg-[#050814] border border-[#1d2440] rounded-lg px-3 py-2 text-[#f5f7ff] focus:border-[#56ccf2] outline-none text-sm"
                >
                    <option value="custom">Custom Configuration</option>
                    {PLOT_TEMPLATES.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                </select>
                {selectedTemplateId !== 'custom' && (
                    <p className="text-[10px] text-[#555b75] italic">
                        {PLOT_TEMPLATES.find(t => t.id === selectedTemplateId)?.description}
                    </p>
                )}
            </div>

            {/* Dimensions */}
            <div className="space-y-3 pt-2 border-t border-[#1d2440]">
                <label className="text-xs font-medium text-[#9ba2c0] uppercase tracking-wide flex items-center gap-2">
                    <Maximize className="w-3.5 h-3.5" />
                    Dimensions (Meters)
                </label>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-[10px] text-[#555b75] mb-1 block">Width</label>
                        <input
                            type="number"
                            value={width}
                            onChange={(e) => handleManualChange(setWidth, Number(e.target.value))}
                            className="w-full bg-[#050814] border border-[#1d2440] rounded-lg px-3 py-2 text-[#f5f7ff] focus:border-[#56ccf2] outline-none"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] text-[#555b75] mb-1 block">Length</label>
                        <input
                            type="number"
                            value={length}
                            onChange={(e) => handleManualChange(setLength, Number(e.target.value))}
                            className="w-full bg-[#050814] border border-[#1d2440] rounded-lg px-3 py-2 text-[#f5f7ff] focus:border-[#56ccf2] outline-none"
                        />
                    </div>
                </div>
                {/* Presets */}
                <div className="flex gap-2">
                    {[10, 20, 50].map(size => (
                        <button
                            key={size}
                            onClick={() => { handleManualChange(setWidth, size); handleManualChange(setLength, size); }}
                            className="px-2 py-1 text-xs bg-[#11182b] border border-[#1d2440] rounded text-[#9ba2c0] hover:text-[#f5f7ff] hover:border-[#56ccf2] transition"
                        >
                            {size}x{size}m
                        </button>
                    ))}
                </div>
            </div>

            {/* Quadrants */}
            <div className="space-y-3 pt-2 border-t border-[#1d2440]">
                <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-[#9ba2c0] uppercase tracking-wide flex items-center gap-2">
                        <LayoutGrid className="w-3.5 h-3.5" />
                        Quadrants
                    </label>
                    <button
                        onClick={() => handleManualChange(setUseQuadrants, !useQuadrants)}
                        className={clsx(
                            "w-10 h-5 rounded-full relative transition-colors duration-200",
                            useQuadrants ? "bg-[#52d273]" : "bg-[#1d2440]"
                        )}
                    >
                        <div className={clsx(
                            "absolute top-1 left-1 w-3 h-3 rounded-full bg-white transition-transform duration-200",
                            useQuadrants ? "translate-x-5" : "translate-x-0"
                        )} />
                    </button>
                </div>
                {useQuadrants && (
                    <p className="text-[10px] text-[#555b75]">
                        Divides the plot into a 2x2 grid (4 quadrants).
                    </p>
                )}
            </div>

            {/* Subplots */}
            <div className="space-y-3 pt-2 border-t border-[#1d2440]">
                <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-[#9ba2c0] uppercase tracking-wide flex items-center gap-2">
                        <LayoutGrid className="w-3.5 h-3.5" />
                        Subplots
                    </label>
                    <button
                        onClick={() => handleManualChange(setUseSubplots, !useSubplots)}
                        className={clsx(
                            "w-10 h-5 rounded-full relative transition-colors duration-200",
                            useSubplots ? "bg-[#52d273]" : "bg-[#1d2440]"
                        )}
                    >
                        <div className={clsx(
                            "absolute top-1 left-1 w-3 h-3 rounded-full bg-white transition-transform duration-200",
                            useSubplots ? "translate-x-5" : "translate-x-0"
                        )} />
                    </button>
                </div>

                {useSubplots && (
                    <div className="space-y-3 pl-4 border-l-2 border-[#1d2440]">
                        {/* Size */}
                        <div>
                            <label className="text-[10px] text-[#555b75] mb-1 block">Size (Meters)</label>
                            <div className="flex gap-2">
                                {[1, 2, 5].map(size => (
                                    <button
                                        key={size}
                                        onClick={() => handleManualChange(setSubplotSize, size)}
                                        className={clsx(
                                            "px-3 py-1.5 text-xs border rounded transition",
                                            subplotSize === size
                                                ? "bg-[#0b2214] border-[#52d273] text-[#52d273]"
                                                : "bg-[#11182b] border-[#1d2440] text-[#9ba2c0]"
                                        )}
                                    >
                                        {size}x{size}m
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Placement */}
                        <div>
                            <label className="text-[10px] text-[#555b75] mb-1 block">Placement</label>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleManualChange(setSubplotPlacement, 'CORNER')}
                                    className={clsx(
                                        "px-3 py-1.5 text-xs border rounded transition",
                                        subplotPlacement === 'CORNER'
                                            ? "bg-[#0b2214] border-[#52d273] text-[#52d273]"
                                            : "bg-[#11182b] border-[#1d2440] text-[#9ba2c0]"
                                    )}
                                >
                                    Corners (4)
                                </button>
                                <button
                                    onClick={() => handleManualChange(setSubplotPlacement, 'CENTER')}
                                    className={clsx(
                                        "px-3 py-1.5 text-xs border rounded transition",
                                        subplotPlacement === 'CENTER'
                                            ? "bg-[#0b2214] border-[#52d273] text-[#52d273]"
                                            : "bg-[#11182b] border-[#1d2440] text-[#9ba2c0]"
                                    )}
                                >
                                    Center (1)
                                </button>
                            </div>
                        </div>

                        {/* Exclusion */}
                        <div className="flex items-center gap-2 pt-1">
                            <input
                                type="checkbox"
                                id="excludeCanopy"
                                checked={excludeCanopy}
                                onChange={(e) => handleManualChange(setExcludeCanopy, e.target.checked)}
                                className="rounded border-[#1d2440] bg-[#050814] text-[#52d273] focus:ring-[#52d273]"
                            />
                            <label htmlFor="excludeCanopy" className="text-xs text-[#9ba2c0] select-none cursor-pointer">
                                Exclude Trees (Canopy)
                            </label>
                        </div>
                        {excludeCanopy && (
                            <div className="flex items-start gap-2 text-[10px] text-[#ff7e67] bg-[#1a1111] p-2 rounded border border-[#331f1f]">
                                <AlertCircle className="w-3 h-3 mt-0.5" />
                                Trees will not be generated inside subplots.
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
