import React, { useState } from 'react';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { Camera, ArrowRight, Check, Tree } from 'phosphor-react';

export const TreeForm: React.FC = () => {
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [formData, setFormData] = useState({
        tag: '',
        species: '',
        gbh: '',
        height: '',
    });

    const handleNext = () => setStep((prev) => Math.min(prev + 1, 3) as any);
    // const handleBack = () => setStep((prev) => Math.max(prev - 1, 1) as any); // Not used yet

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log('Submitted:', formData);
        alert('Tree Saved!');
        setStep(1);
        setFormData({ tag: '', species: '', gbh: '', height: '' });
    };

    return (
        <div className="max-w-md mx-auto bg-panel border border-border rounded-xl overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="bg-panel-soft p-4 border-b border-border flex justify-between items-center">
                <div className="flex items-center gap-2 text-primary">
                    <Tree size={20} weight="duotone" />
                    <h3 className="font-semibold">New Tree Entry</h3>
                </div>
                <div className="flex gap-1">
                    {[1, 2, 3].map((s) => (
                        <div
                            key={s}
                            className={`w-2 h-2 rounded-full ${s === step ? 'bg-primary' : s < step ? 'bg-success' : 'bg-border'
                                }`}
                        />
                    ))}
                </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {step === 1 && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                        <Input
                            label="Tag Number"
                            placeholder="e.g. T-101"
                            value={formData.tag}
                            onChange={(e) => setFormData({ ...formData, tag: e.target.value })}
                            autoFocus
                        />
                        <Select
                            label="Species"
                            options={[
                                { value: 'teak', label: 'Tectona grandis (Teak)' },
                                { value: 'neem', label: 'Azadirachta indica (Neem)' },
                                { value: 'banyan', label: 'Ficus benghalensis (Banyan)' },
                            ]}
                            value={formData.species}
                            onChange={(e) => setFormData({ ...formData, species: e.target.value })}
                        />
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                        <Input
                            label="GBH (cm)"
                            type="number"
                            placeholder="0.0"
                            value={formData.gbh}
                            onChange={(e) => setFormData({ ...formData, gbh: e.target.value })}
                            autoFocus
                        />
                        <Input
                            label="Height (m)"
                            type="number"
                            placeholder="0.0"
                            value={formData.height}
                            onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                        />
                    </div>
                )}

                {step === 3 && (
                    <div className="space-y-4 text-center animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="p-8 border-2 border-dashed border-border rounded-xl hover:border-primary/50 transition-colors cursor-pointer group">
                            <Camera size={48} className="mx-auto text-text-muted group-hover:text-primary mb-2" />
                            <p className="text-sm text-text-muted">Tap to capture photo</p>
                        </div>
                    </div>
                )}

                <div className="pt-4 flex justify-end">
                    {step < 3 ? (
                        <Button type="button" onClick={handleNext} rightIcon={<ArrowRight size={16} />}>
                            Next Step
                        </Button>
                    ) : (
                        <Button type="submit" variant="success" leftIcon={<Check size={16} />}>
                            Save Tree
                        </Button>
                    )}
                </div>
            </form>
        </div>
    );
};
