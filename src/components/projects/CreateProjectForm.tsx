import React, { useState } from 'react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { useRepositories } from '../../hooks/useRepositories';
import { Plus } from 'phosphor-react';

interface CreateProjectFormProps {
    onSuccess?: () => void;
    onCancel?: () => void;
}

export const CreateProjectForm: React.FC<CreateProjectFormProps> = ({ onSuccess, onCancel }) => {
    const { addProject } = useRepositories();
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        setIsSubmitting(true);
        try {
            await addProject(name, description);
            setName('');
            setDescription('');
            onSuccess?.();
        } catch (error) {
            console.error('Failed to create project:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <Input
                label="Project Name"
                placeholder="e.g. Western Ghats Survey 2025"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
                required
            />

            <div>
                <label className="block text-sm font-medium text-text-muted mb-1.5">
                    Description
                </label>
                <textarea
                    className="w-full bg-panel border border-border rounded-lg px-4 py-2.5 text-text-main placeholder-text-muted/50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/50 min-h-[100px]"
                    placeholder="Optional details about the survey area..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                />
            </div>

            <div className="flex justify-end gap-3 pt-2">
                {onCancel && (
                    <Button type="button" variant="ghost" onClick={onCancel}>
                        Cancel
                    </Button>
                )}
                <Button
                    type="submit"
                    isLoading={isSubmitting}
                    leftIcon={<Plus size={16} />}
                >
                    Create Project
                </Button>
            </div>
        </form>
    );
};
