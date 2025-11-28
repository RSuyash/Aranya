import React, { useState, useEffect } from 'react';
import {
    LayoutGrid, Maximize, BookTemplate,
    Grid3x3, Square, CheckCircle2, BoxSelect
} from 'lucide-react';
import { clsx } from 'clsx';
import type { PlotConfiguration, SubplotRule } from '../../../../core/plot-engine/types';
import { PLOT_TEMPLATES } from '../data/plotTemplates';

interface PlotConfiguratorProps {
    onChange: (config: PlotConfiguration) => void;
    initialConfig?: PlotConfiguration;
}

// --- SUB-COMPONENT: LIVE PREVIEW ---
const ConfigPreview = ({ width, length, useGrid, useSubplots, subplotSize, subplotPlacement }: any) => {
    // Calculate aspect ratio for the preview box
    const maxDim = Math.max(width, length);
    const aspectW = width / maxDim;
    const aspectH = length / maxDim;

    // Calculate subplot relative size based on actual dimensions
    const relativeSubplotSize = useSubplots
        ? Math.min(0.3, subplotSize / Math.min(width, length))
        : 0;

    return (
        <div className="w-full aspect-square bg-app rounded-xl border border-border flex items-center justify-center relative overflow-hidden p-8">
            {/* Background Grid Pattern */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
                style={{
                    backgroundImage: 'linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)',
                    backgroundSize: '20px 20px'
                }}
            />

            {/* The Plot Container */}
            <div
                className="relative border-2 border-text-main bg-panel shadow-2xl transition-all duration-500"
                style={{
                    width: `${aspectW * 100}%`,
                    height: `${aspectH * 100}%`,
                    maxWidth: '240px',
                    maxHeight: '240px'
                }}
            >
                {/* 1. GRID LAYER */}
                {useGrid && (
                    <div className="absolute inset-0 grid grid-cols-2 grid-rows-2">
                        <div className="border-r border-b border-border/50 flex items-center justify-center text-[10px] text-text-muted font-mono">Q2</div>
                        <div className="border-b border-border/50 flex items-center justify-center text-[10px] text-text-muted font-mono">Q1</div>
                        <div className="border-r border-border/50 flex items-center justify-center text-[10px] text-text-muted font-mono">Q3</div>
                        <div className="flex items-center justify-center text-[10px] text-text-muted font-mono">Q4</div>
                    </div>
                )}

                {/* 2. SUBPLOTS LAYER */}
                {useSubplots && (
                    <>
                        {subplotPlacement === 'CORNER' ? (
                            <>
                                {/* SW */}
                                <div className="absolute bottom-0 left-0 border-t border-r border-success bg-success/10 transition-all duration-300"
                                    style={{ width: `${relativeSubplotSize * 100}%`, height: `${relativeSubplotSize * 100}%` }} />
                                {/* SE */}
                                <div className="absolute bottom-0 right-0 border-t border-l border-success bg-success/10 transition-all duration-300"
                                    style={{ width: `${relativeSubplotSize * 100}%`, height: `${relativeSubplotSize * 100}%` }} />
                                {/* NW */}
                                <div className="absolute top-0 left-0 border-b border-r border-success bg-success/10 transition-all duration-300"
                                    style={{ width: `${relativeSubplotSize * 100}%`, height: `${relativeSubplotSize * 100}%` }} />
                                {/* NE */}
                                <div className="absolute top-0 right-0 border-b border-l border-success bg-success/10 transition-all duration-300"
                                    style={{ width: `${relativeSubplotSize * 100}%`, height: `${relativeSubplotSize * 100}%` }} />
                            </>
                        ) : (
                            // CENTER
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border border-success bg-success/10 transition-all duration-300"
                                style={{ width: `${relativeSubplotSize * 100}%`, height: `${relativeSubplotSize * 100}%` }} />
                        )}
                    </>
                )}

                {/* Dimensions Label */}
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-mono text-text-muted whitespace-nowrap">
                    {width}m
                </div>
                <div className="absolute top-1/2 -left-6 -translate-y-1/2 text-[10px] font-mono text-text-muted -rotate-90 whitespace-nowrap">
                    {length}m
                </div>
            </div>
        </div>
    );
};

export const PlotConfigurator: React.FC<PlotConfiguratorProps> = ({ onChange, initialConfig }) => {
    const [selectedTemplateId, setSelectedTemplateId] = useState<string>('custom');
    const [width, setWidth] = useState(initialConfig?.dimensions.width || 20);
    const [length, setLength] = useState(initialConfig?.dimensions.length || 20);
    const [useQuadrants, setUseQuadrants] = useState(initialConfig?.grid.enabled ?? true);
    const [useSubplots, setUseSubplots] = useState(initialConfig?.subplots.enabled ?? true);
    const [subplotSize, setSubplotSize] = useState(initialConfig?.subplots.rules?.[0]?.dimensions?.width || 1);
    const [subplotPlacement, setSubplotPlacement] = useState<'CORNER' | 'CENTER'>('CORNER');
    const [excludeCanopy, setExcludeCanopy] = useState(false);

    const applyTemplate = (templateId: string) => {
        setSelectedTemplateId(templateId);
        const template = PLOT_TEMPLATES.find(t => t.id === templateId);
        if (!template) return;
        const config = template.config;
        setWidth(config.dimensions.width);
        setLength(config.dimensions.length);
        setUseQuadrants(config.grid.enabled);
        setUseSubplots(config.subplots.enabled);
        // Reset subplots logic if template implies it (simplified for now)
    };

    // Propagate Changes
    useEffect(() => {
        const config: PlotConfiguration = {
            shape: 'RECTANGLE',
            dimensions: { width, length },
            grid: { enabled: useQuadrants, rows: 2, cols: 2, labelStyle: 'Q1-Q4' },
            subplots: { enabled: useSubplots, rules: [] },
            rules: { minInterTreeDistance: 0.5 }
        };

        if (useSubplots) {
            const rules: SubplotRule[] = [];
            const dims = { width: subplotSize, length: subplotSize };
            if (subplotPlacement === 'CORNER') {
                ['SW', 'SE', 'NW', 'NE'].forEach(pos => {
                    rules.push({
                        type: 'fixed',
                        shape: 'RECTANGLE',
                        dimensions: dims,
                        position: `CORNER_${pos}` as any,
                        strata: ['HERB'],
                        excludesCanopy: excludeCanopy
                    });
                });
            } else {
                rules.push({
                    type: 'fixed',
                    shape: 'RECTANGLE',
                    dimensions: dims,
                    position: 'CENTER',
                    strata: ['HERB'],
                    excludesCanopy: excludeCanopy
                });
            }
            config.subplots.rules = rules;
        }
        onChange(config);
    }, [width, length, useQuadrants, useSubplots, subplotSize, subplotPlacement, excludeCanopy, onChange]);

    const handleManualChange = (setter: (val: any) => void, val: any) => {
        setter(val);
        setSelectedTemplateId('custom');
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

            {/* LEFT COLUMN: Controls */}
            <div className="space-y-8">

                {/* 1. Template Selection */}
                <div className="space-y-3">
                    <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest flex items-center gap-2">
                        <BookTemplate size={14} className="text-primary" /> Protocol Template
                    </label>
                    <select
                        value={selectedTemplateId}
                        onChange={(e) => applyTemplate(e.target.value)}
                        className="w-full bg-panel border border-border rounded-xl px-4 py-3 text-text-main focus:border-primary outline-none text-sm transition-colors shadow-sm cursor-pointer hover:bg-panel-soft"
                    >
                        <option value="custom">Custom Configuration</option>
                        {PLOT_TEMPLATES.map(t => (
                            <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                    </select>
                </div>

                {/* 2. Dimensions */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-text-main border-b border-border pb-2">
                        <Maximize size={16} />
                        <h3 className="font-bold text-xs uppercase tracking-wide">Boundary Geometry</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] text-text-muted mb-1.5 block font-medium uppercase">Width (m)</label>
                            <input
                                type="number"
                                value={width}
                                onChange={(e) => handleManualChange(setWidth, Number(e.target.value))}
                                className="w-full bg-panel border border-border rounded-xl px-4 py-2.5 text-text-main font-mono font-bold focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] text-text-muted mb-1.5 block font-medium uppercase">Length (m)</label>
                            <input
                                type="number"
                                value={length}
                                onChange={(e) => handleManualChange(setLength, Number(e.target.value))}
                                className="w-full bg-panel border border-border rounded-xl px-4 py-2.5 text-text-main font-mono font-bold focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                            />
                        </div>
                    </div>
                </div>

                {/* 3. Internal Structure */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-text-main border-b border-border pb-2">
                        <LayoutGrid size={16} />
                        <h3 className="font-bold text-xs uppercase tracking-wide">Internal Layout</h3>
                    </div>

                    {/* Quadrants Toggle */}
                    <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-panel-soft/30 hover:border-primary/30 transition-colors">
                        <div className="flex items-center gap-3">
                            <div className={clsx("p-2 rounded-lg", useQuadrants ? "bg-primary/10 text-primary" : "bg-white/5 text-text-muted")}>
                                <Grid3x3 size={18} />
                            </div>
                            <div>
                                <div className="text-sm font-bold text-text-main">Quadrants</div>
                                <div className="text-[10px] text-text-muted">Divide into 4 sub-units (2x2)</div>
                            </div>
                        </div>
                        <button
                            onClick={() => handleManualChange(setUseQuadrants, !useQuadrants)}
                            className={clsx(
                                "w-10 h-6 rounded-full relative transition-colors duration-200",
                                useQuadrants ? "bg-primary" : "bg-white/10"
                            )}
                        >
                            <div className={clsx(
                                "absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200",
                                useQuadrants ? "translate-x-4" : "translate-x-0"
                            )} />
                        </button>
                    </div>

                    {/* Subplots Toggle */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-panel-soft/30 hover:border-success/30 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className={clsx("p-2 rounded-lg", useSubplots ? "bg-success/10 text-success" : "bg-white/5 text-text-muted")}>
                                    <Square size={18} />
                                </div>
                                <div>
                                    <div className="text-sm font-bold text-text-main">Nested Subplots</div>
                                    <div className="text-[10px] text-text-muted">For herbaceous/regeneration</div>
                                </div>
                            </div>
                            <button
                                onClick={() => handleManualChange(setUseSubplots, !useSubplots)}
                                className={clsx(
                                    "w-10 h-6 rounded-full relative transition-colors duration-200",
                                    useSubplots ? "bg-success" : "bg-white/10"
                                )}
                            >
                                <div className={clsx(
                                    "absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200",
                                    useSubplots ? "translate-x-4" : "translate-x-0"
                                )} />
                            </button>
                        </div>

                        {/* Nested Subplot Settings */}
                        {useSubplots && (
                            <div className="pl-4 ml-4 border-l-2 border-border space-y-4 animate-in slide-in-from-left-2 fade-in duration-300">
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[10px] text-text-muted mb-1.5 block font-medium uppercase">Size (m)</label>
                                        <div className="flex gap-1 bg-panel border border-border rounded-lg p-1">
                                            {[1, 2, 5].map(size => (
                                                <button
                                                    key={size}
                                                    onClick={() => handleManualChange(setSubplotSize, size)}
                                                    className={clsx(
                                                        "flex-1 py-1 text-xs rounded transition-all font-medium",
                                                        subplotSize === size
                                                            ? "bg-success text-white shadow-sm"
                                                            : "text-text-muted hover:text-text-main"
                                                    )}
                                                >
                                                    {size}m
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-text-muted mb-1.5 block font-medium uppercase">Position</label>
                                        <div className="flex gap-1 bg-panel border border-border rounded-lg p-1">
                                            <button
                                                onClick={() => handleManualChange(setSubplotPlacement, 'CORNER')}
                                                className={clsx(
                                                    "flex-1 py-1 text-xs rounded transition-all font-medium",
                                                    subplotPlacement === 'CORNER' ? "bg-success text-white" : "text-text-muted hover:text-text-main"
                                                )}
                                            >
                                                Corners
                                            </button>
                                            <button
                                                onClick={() => handleManualChange(setSubplotPlacement, 'CENTER')}
                                                className={clsx(
                                                    "flex-1 py-1 text-xs rounded transition-all font-medium",
                                                    subplotPlacement === 'CENTER' ? "bg-success text-white" : "text-text-muted hover:text-text-main"
                                                )}
                                            >
                                                Center
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <div className={clsx(
                                        "w-4 h-4 rounded border flex items-center justify-center transition-colors",
                                        excludeCanopy ? "bg-success border-success" : "border-text-muted group-hover:border-text-main"
                                    )}>
                                        {excludeCanopy && <CheckCircle2 size={12} className="text-white" />}
                                        <input
                                            type="checkbox"
                                            className="hidden"
                                            checked={excludeCanopy}
                                            onChange={(e) => handleManualChange(setExcludeCanopy, e.target.checked)}
                                        />
                                    </div>
                                    <span className="text-xs text-text-muted group-hover:text-text-main transition-colors">Exclude Trees from Subplots</span>
                                </label>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* RIGHT COLUMN: Visual Preview */}
            <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2 text-text-main border-b border-border pb-2">
                    <BoxSelect size={16} />
                    <h3 className="font-bold text-xs uppercase tracking-wide">Visual Preview</h3>
                </div>

                <div className="flex-1 bg-panel-soft/30 rounded-2xl border border-border p-6 flex flex-col items-center justify-center">
                    <ConfigPreview
                        width={width}
                        length={length}
                        useGrid={useQuadrants}
                        useSubplots={useSubplots}
                        subplotSize={subplotSize}
                        subplotPlacement={subplotPlacement}
                    />
                    <p className="text-center text-xs text-text-muted mt-6 max-w-xs">
                        This schematic represents the logical structure of your plot. GPS coordinates will be mapped relative to these boundaries.
                    </p>
                </div>
            </div>
        </div>
    );
};