import React from 'react';
import { Sprout, TreeDeciduous, Leaf, Wheat, Flower } from 'lucide-react';
import { clsx } from 'clsx';

export type GrowthForm = 'HERB' | 'SHRUB' | 'CLIMBER' | 'GRASS' | 'FERN';

export const GROWTH_FORMS: Array<{ value: GrowthForm; label: string; icon: React.ReactNode; color: string }> = [
    { value: 'HERB', label: 'Herb', icon: <Sprout className="w-6 h-6" />, color: '#52d273' },
    { value: 'SHRUB', label: 'Shrub', icon: <TreeDeciduous className="w-6 h-6" />, color: '#56ccf2' },
    { value: 'CLIMBER', label: 'Climber', icon: <Leaf className="w-6 h-6" />, color: '#9b87f5' },
    { value: 'GRASS', label: 'Grass', icon: <Wheat className="w-6 h-6" />, color: '#f4d03f' },
    { value: 'FERN', label: 'Fern', icon: <Flower className="w-6 h-6" />, color: '#6cb2eb' },
];

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
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            {/* Growth Form Selection */}
            <div>
                <label className="block text-xs font-medium text-text-muted uppercase mb-3">Growth Form *</label>
                <div className="grid grid-cols-2 gap-3">
                    {GROWTH_FORMS.map(form => (
                        <button
                            key={form.value}
                            onClick={() => setGrowthForm(form.value)}
                            className={clsx(
                                "p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition",
                                growthForm === form.value
                                    ? "border-primary bg-primary/10"
                                    : "border-border bg-panel-soft hover:border-primary"
                            )}
                        >
                            <div style={{ color: growthForm === form.value ? form.color : 'var(--text-muted)' }}>
                                {form.icon}
                            </div>
                            <span className={clsx(
                                "text-sm font-medium",
                                growthForm === form.value ? "text-text-main" : "text-text-muted"
                            )}>
                                {form.label}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Species Name */}
            <div>
                <label className="block text-xs font-medium text-text-muted uppercase mb-2">Species</label>
                <input
                    type="text"
                    value={speciesName}
                    onChange={e => setSpeciesName(e.target.value)}
                    disabled={isUnknown}
                    className="w-full bg-panel-soft border border-border rounded-xl px-4 py-3 text-lg text-text-main focus:border-primary outline-none disabled:opacity-50"
                    placeholder="Search species..."
                />
                <div className="mt-3 flex items-center gap-2">
                    <input
                        type="checkbox"
                        id="unknown-species"
                        checked={isUnknown}
                        onChange={e => setIsUnknown(e.target.checked)}
                        className="w-4 h-4 rounded border-border bg-panel-soft text-primary"
                    />
                    <label htmlFor="unknown-species" className="text-sm text-text-muted">Unknown Species</label>
                </div>
            </div>
        </div>
    );
};
