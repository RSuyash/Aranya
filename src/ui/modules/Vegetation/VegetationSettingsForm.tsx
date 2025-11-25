import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../../core/data-model/dexie';
import type { VegetationModule } from '../../../core/data-model/types';
import { BlueprintRegistry } from '../../../core/plot-engine/blueprints';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Save, Upload, Trash2, FileText } from 'lucide-react';
import { clsx } from 'clsx';

interface VegetationSettingsFormProps {
    moduleId: string;
}

export const VegetationSettingsForm: React.FC<VegetationSettingsFormProps> = ({ moduleId }) => {
    const module = useLiveQuery(() => db.modules.get(moduleId) as Promise<VegetationModule>, [moduleId]);
    const [formData, setFormData] = useState<Partial<VegetationModule>>({});
    const [isSaving, setIsSaving] = useState(false);
    const [speciesFile, setSpeciesFile] = useState<File | null>(null);

    const blueprints = BlueprintRegistry.getAll();

    useEffect(() => {
        if (module) {
            setFormData({
                samplingMethod: module.samplingMethod || 'SYSTEMATIC',
                strataRules: module.strataRules || { minTreeGbhCm: 30, minShrubHeightCm: 50 },
                validationSettings: module.validationSettings || { maxGpsAccuracyM: 10, mandatoryPhotos: true },
                defaultBlueprintId: module.defaultBlueprintId || blueprints[0]?.id,
                predefinedSpeciesList: module.predefinedSpeciesList || []
            });
        }
    }, [module]);

    const handleSave = async () => {
        if (!module) return;
        setIsSaving(true);
        try {
            const updates: Partial<VegetationModule> = {
                ...formData,
                updatedAt: Date.now()
            };

            // If we have a species file, process it (Simple CSV parser for now)
            // Format: Scientific Name, Common Name, Type (TREE|SHRUB|HERB)
            if (speciesFile) {
                const text = await speciesFile.text();
                const lines = text.split('\n').slice(1); // Skip header
                const speciesList = lines.map(line => {
                    const [sci, com, type] = line.split(',').map(s => s.trim());
                    if (!sci) return null;
                    return {
                        id: sci.toLowerCase().replace(/\s+/g, '-'),
                        scientificName: sci,
                        commonName: com || '',
                        type: (type as any) || 'ALL'
                    };
                }).filter(Boolean) as VegetationModule['predefinedSpeciesList'];

                updates.predefinedSpeciesList = speciesList;
            }

            await db.modules.update(moduleId, updates);
            setSpeciesFile(null);
            alert('Settings saved successfully!');
        } catch (err) {
            console.error(err);
            alert('Failed to save settings.');
        } finally {
            setIsSaving(false);
        }
    };

    const updateStrata = (key: string, val: number) => {
        setFormData(prev => ({
            ...prev,
            strataRules: { ...prev.strataRules, [key]: val }
        }));
    };

    const updateValidation = (key: string, val: any) => {
        setFormData(prev => ({
            ...prev,
            validationSettings: { ...prev.validationSettings, [key]: val } as any
        }));
    };

    if (!module) return <div>Loading...</div>;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* General Config */}
            <section className="space-y-4">
                <h3 className="text-sm font-medium text-[#9ba2c0] uppercase tracking-wider border-b border-[#1d2440] pb-2">
                    Survey Configuration
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm text-[#f5f7ff]">Default Plot Layout</label>
                        <Select
                            value={formData.defaultBlueprintId}
                            onChange={(e) => setFormData({ ...formData, defaultBlueprintId: e.target.value })}
                            options={blueprints.map(bp => ({ label: bp.name, value: bp.id }))}
                        />
                        <p className="text-xs text-[#9ba2c0]">
                            New plots will use this layout by default.
                        </p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm text-[#f5f7ff]">Sampling Method</label>
                        <Select
                            value={formData.samplingMethod}
                            onChange={(e) => setFormData({ ...formData, samplingMethod: e.target.value as any })}
                            options={[
                                { label: 'Systematic (Grid)', value: 'SYSTEMATIC' },
                                { label: 'Random', value: 'RANDOM' },
                                { label: 'Transect', value: 'TRANSECT' }
                            ]}
                        />
                    </div>
                </div>
            </section>

            {/* Strata Rules */}
            <section className="space-y-4">
                <h3 className="text-sm font-medium text-[#9ba2c0] uppercase tracking-wider border-b border-[#1d2440] pb-2">
                    Biological Definitions
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input
                        label="Min Tree GBH (cm)"
                        type="number"
                        value={formData.strataRules?.minTreeGbhCm}
                        onChange={(e) => updateStrata('minTreeGbhCm', parseFloat(e.target.value))}
                    />
                    <Input
                        label="Min Shrub Height (cm)"
                        type="number"
                        value={formData.strataRules?.minShrubHeightCm}
                        onChange={(e) => updateStrata('minShrubHeightCm', parseFloat(e.target.value))}
                    />
                </div>
            </section>

            {/* Data Quality */}
            <section className="space-y-4">
                <h3 className="text-sm font-medium text-[#9ba2c0] uppercase tracking-wider border-b border-[#1d2440] pb-2">
                    Data Quality & Validation
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input
                        label="Max GPS Error (meters)"
                        type="number"
                        value={formData.validationSettings?.maxGpsAccuracyM}
                        onChange={(e) => updateValidation('maxGpsAccuracyM', parseFloat(e.target.value))}
                    />

                    <div className="flex items-center gap-3 pt-6">
                        <input
                            type="checkbox"
                            id="mandatoryPhotos"
                            checked={formData.validationSettings?.mandatoryPhotos}
                            onChange={(e) => updateValidation('mandatoryPhotos', e.target.checked)}
                            className="w-5 h-5 rounded border-[#1d2440] bg-[#050814] text-[#56ccf2]"
                        />
                        <label htmlFor="mandatoryPhotos" className="text-sm text-[#f5f7ff]">
                            Require photos for every tree/observation
                        </label>
                    </div>
                </div>
            </section>

            {/* Taxonomy */}
            <section className="space-y-4">
                <h3 className="text-sm font-medium text-[#9ba2c0] uppercase tracking-wider border-b border-[#1d2440] pb-2">
                    Taxonomy Master List
                </h3>

                <div className="bg-[#050814] border border-[#1d2440] rounded-xl p-4">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <div className="text-sm font-medium text-[#f5f7ff]">
                                {formData.predefinedSpeciesList?.length || 0} Species Loaded
                            </div>
                            <div className="text-xs text-[#9ba2c0]">
                                Scientific Name, Common Name, Type
                            </div>
                        </div>
                        {formData.predefinedSpeciesList && formData.predefinedSpeciesList.length > 0 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setFormData({ ...formData, predefinedSpeciesList: [] })}
                                leftIcon={<Trash2 size={14} />}
                                className="text-[#ff7e67] hover:text-[#ff7e67] hover:bg-[#ff7e67]/10"
                            >
                                Clear List
                            </Button>
                        )}
                    </div>

                    <div className="flex items-center gap-4">
                        <label className="flex-1 cursor-pointer group">
                            <div className="border-2 border-dashed border-[#1d2440] group-hover:border-[#56ccf2] rounded-lg p-6 flex flex-col items-center justify-center transition bg-[#11182b]/50">
                                <Upload className="w-6 h-6 text-[#9ba2c0] group-hover:text-[#56ccf2] mb-2" />
                                <span className="text-sm text-[#9ba2c0] group-hover:text-[#f5f7ff]">
                                    {speciesFile ? speciesFile.name : "Upload CSV Species List"}
                                </span>
                                <input
                                    type="file"
                                    accept=".csv"
                                    className="hidden"
                                    onChange={(e) => setSpeciesFile(e.target.files?.[0] || null)}
                                />
                            </div>
                        </label>

                        <div className="w-px h-16 bg-[#1d2440]" />

                        <div className="w-1/3 text-xs text-[#9ba2c0] space-y-1">
                            <p className="font-medium text-[#f5f7ff]">CSV Format:</p>
                            <code className="block bg-[#11182b] p-2 rounded border border-[#1d2440]">
                                Scientific Name, Common Name, Type<br />
                                Tectona grandis, Teak, TREE
                            </code>
                        </div>
                    </div>
                </div>
            </section>

            <div className="pt-6 border-t border-[#1d2440] flex justify-end">
                <Button
                    onClick={handleSave}
                    isLoading={isSaving}
                    leftIcon={<Save size={18} />}
                    className="min-w-[150px]"
                >
                    Save Configuration
                </Button>
            </div>
        </div>
    );
};
