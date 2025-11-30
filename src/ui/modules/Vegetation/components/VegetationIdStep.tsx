import React from 'react';
import { Sprout, TreeDeciduous, Leaf, Wheat, Flower, Search, HelpCircle } from 'lucide-react';
import { clsx } from 'clsx';

export type GrowthForm = 'HERB' | 'SHRUB' | 'CLIMBER' | 'GRASS' | 'FERN';

// REMOVED: Hex colors.
// ADDED: Semantic class mapping.
const FORM_CONFIG: Record<GrowthForm, { label: string, icon: any, style: string }> = {
    'HERB': { label: 'Herb', icon: Sprout, style: 'text-success' },
    'SHRUB': { label: 'Shrub', icon: TreeDeciduous, style: 'text-primary' },
    'CLIMBER': { label: 'Climber', icon: Leaf, style: 'text-warning' }, // Using warning/amber for distinction
    'GRASS': { label: 'Grass', icon: Wheat, style: 'text-text-main opacity-80' },
    'FERN': { label: 'Fern', icon: Flower, style: 'text-primary opacity-80' },
};

interface VegetationIdStepProps {
    growthForm: GrowthForm | null;
    setGrowthForm: (form: GrowthForm) => void;
    speciesName: string;
    setSpeciesName: (name: string) => void;
    isUnknown: boolean;
    setIsUnknown: (isUnknown: boolean) => void;
}

export const VegetationIdStep: React.FC<VegetationIdStepProps> = ({
    growthForm,
    setGrowthForm,
    speciesName,
    setSpeciesName,
    isUnknown,
    setIsUnknown
}) => {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">

            {/* 1. MORPHOLOGY SELECTOR */}
            <div>
                <label className="block text-[10px] font-bold text-text-muted uppercase tracking-widest mb-4 pl-1">
                    Growth Morphology
                </label>
                <div className="grid grid-cols-2 gap-3">
                    {(Object.keys(FORM_CONFIG) as GrowthForm[]).map(key => {
                        const conf = FORM_CONFIG[key];
                        const isActive = growthForm === key;
                        const Icon = conf.icon;

                        return (
                            <button
                                key={key}
                                onClick={() => setGrowthForm(key)}
                                className={clsx(
                                    "p-4 rounded-2xl border-2 flex flex-col items-center gap-3 transition-all duration-200 group",
                                    isActive
                                        ? "bg-panel border-primary shadow-[0_0_20px_-5px_rgba(var(--primary),0.3)] scale-[1.02]"
                                        : "bg-panel-soft border-transparent hover:border-border hover:bg-panel"
                                )}
                            >
                                <div className={clsx(
                                    "p-3 rounded-xl transition-colors",
                                    isActive ? "bg-primary/10" : "bg-white/5",
                                    conf.style
                                )}>
                                    <Icon size={28} strokeWidth={isActive ? 2.5 : 1.5} />
                                </div>
                                <span className={clsx(
                                    "text-sm font-bold tracking-wide",
                                    isActive ? "text-text-main" : "text-text-muted group-hover:text-text-main"
                                )}>
                                    {conf.label}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* 2. TAXONOMY INPUT */}
            <div className="relative">
                <label className="block text-[10px] font-bold text-text-muted uppercase tracking-widest mb-2 pl-1">
                    Taxonomic Identity
                </label>

                <div className={clsx(
                    "relative group transition-all duration-300 rounded-2xl overflow-hidden ring-1",
                    isUnknown ? "bg-warning/5 ring-warning/30" : "bg-panel-soft ring-border focus-within:ring-primary focus-within:bg-panel"
                )}>
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted">
                        {isUnknown ? <HelpCircle className="text-warning" size={20} /> : <Search size={20} />}
                    </div>

                    <input
                        type="text"
                        value={speciesName}
                        onChange={e => setSpeciesName(e.target.value)}
                        disabled={isUnknown}
                        className={clsx(
                            "w-full bg-transparent px-12 py-4 text-lg font-medium outline-none transition-colors",
                            isUnknown ? "text-warning placeholder-warning/50 cursor-not-allowed" : "text-text-main placeholder-text-muted/50"
                        )}
                        placeholder={isUnknown ? "Unidentified Specimen" : "Search scientific name..."}
                    />

                    {/* Toggle Switch */}
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                        <label className="flex items-center gap-3 cursor-pointer group/toggle">
                            <span className={clsx("text-xs font-bold uppercase transition-colors", isUnknown ? "text-warning" : "text-text-muted")}>
                                Unknown
                            </span>
                            <div className="relative">
                                <input
                                    type="checkbox"
                                    checked={isUnknown}
                                    onChange={e => {
                                        setIsUnknown(e.target.checked);
                                        if (e.target.checked) setSpeciesName('');
                                    }}
                                    className="sr-only"
                                />
                                <div className={clsx(
                                    "w-10 h-6 rounded-full transition-colors shadow-inner",
                                    isUnknown ? "bg-warning/20" : "bg-black/20 dark:bg-white/10"
                                )} />
                                <div className={clsx(
                                    "absolute top-1 left-1 w-4 h-4 rounded-full shadow-sm transition-transform duration-300",
                                    isUnknown ? "translate-x-4 bg-warning" : "translate-x-0 bg-text-muted"
                                )} />
                            </div>
                        </label>
                    </div>
                </div>

                {isUnknown && (
                    <div className="mt-3 flex items-center gap-2 text-xs text-warning px-2 animate-in slide-in-from-top-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-warning animate-pulse" />
                        <span className="font-medium">Marked for later identification. Photos recommended.</span>
                    </div>
                )}
            </div>
        </div>
    );
};