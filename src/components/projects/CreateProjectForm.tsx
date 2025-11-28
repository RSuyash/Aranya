import React, { useState, useEffect } from 'react';
import {
    FileText, Type,
    Globe, Calendar, Sparkles, Check
} from 'lucide-react';
import { clsx } from 'clsx';
import { useRepositories } from '../../hooks/useRepositories';

interface CreateProjectFormProps {
    onSuccess?: () => void;
    onCancel?: () => void;
}

export const CreateProjectForm: React.FC<CreateProjectFormProps> = ({ onSuccess, onCancel }) => {
    const { addProject } = useRepositories();

    // Form State
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Derived State for "Project
    //  Tag" visualization
    const [projectCode, setProjectCode] = useState('PRJ-____');

    useEffect(() => {
        if (!name) {
            setProjectCode('PRJ-____');
            return;
        }
        // Generate a cool looking code: "Western Ghats" -> "PRJ-WESTERN-G"
        const cleanName = name.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
        const code = cleanName.slice(0, 12) || '____';
        setProjectCode(`PRJ-${code}`);
    }, [name]);

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
        <form onSubmit={handleSubmit} className="space-y-6">

            {/* --- TOP SECTION: IDENTITY --- */}
            <div className="space-y-4">

                {/* Visual Preview Badge */}
                <div className="flex items-center justify-between bg-panel-soft/50 rounded-xl p-3 border border-white/5">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg text-primary border border-primary/20">
                            <Globe size={18} />
                        </div>
                        <div>
                            <div className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Project ID</div>
                            <div className="font-mono text-sm text-text-main tracking-wider">{projectCode}</div>
                        </div>
                    </div>
                    <div className="text-[10px] text-text-muted flex items-center gap-1.5 bg-white/5 px-2 py-1 rounded">
                        <Calendar size={10} />
                        {new Date().toLocaleDateString()}
                    </div>
                </div>

                {/* Name Input */}
                <div className="group relative">
                    <label className="block text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1.5 group-focus-within:text-primary transition-colors">
                        Project Designation
                    </label>
                    <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors">
                            <Type size={18} />
                        </div>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Western Ghats Biodiversity Survey"
                            className="w-full bg-panel border-2 border-white/5 rounded-xl pl-12 pr-4 py-3.5 text-text-main placeholder:text-text-muted/30 focus:border-primary/50 focus:bg-panel-soft focus:ring-0 outline-none transition-all font-medium text-base"
                            autoFocus
                            required
                        />
                        {/* Validation Check */}
                        {name.length > 3 && (
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-success animate-in zoom-in">
                                <Check size={16} strokeWidth={3} />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* --- MIDDLE SECTION: CONTEXT --- */}
            <div className="group relative">
                <div className="flex justify-between items-baseline mb-1.5">
                    <label className="block text-[10px] font-bold text-text-muted uppercase tracking-widest group-focus-within:text-primary transition-colors">
                        Operational Briefing
                    </label>
                    <span className={clsx(
                        "text-[10px] font-mono",
                        description.length > 150 ? "text-warning" : "text-text-muted"
                    )}>
                        {description.length}/200
                    </span>
                </div>

                <div className="relative">
                    <div className="absolute left-4 top-4 text-text-muted group-focus-within:text-primary transition-colors">
                        <FileText size={18} />
                    </div>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Describe the survey area, objectives, and methodology..."
                        maxLength={200}
                        className="w-full bg-panel border-2 border-white/5 rounded-xl pl-12 pr-4 py-3 text-text-main placeholder:text-text-muted/30 focus:border-primary/50 focus:bg-panel-soft focus:ring-0 outline-none transition-all min-h-[120px] resize-none leading-relaxed text-sm"
                    />
                </div>
            </div>

            {/* --- BOTTOM SECTION: ACTIONS --- */}
            <div className="pt-2 flex items-center justify-end gap-3 border-t border-white/5">
                {onCancel && (
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-5 py-2.5 rounded-xl text-sm font-medium text-text-muted hover:text-text-main hover:bg-white/5 transition-all"
                    >
                        Cancel
                    </button>
                )}

                <button
                    type="submit"
                    disabled={isSubmitting || !name.trim()}
                    className={clsx(
                        "relative flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg overflow-hidden group/btn",
                        !name.trim()
                            ? "bg-white/5 text-text-muted cursor-not-allowed"
                            : "bg-primary text-app hover:bg-primary/90 hover:shadow-primary/20 hover:-translate-y-0.5"
                    )}
                >
                    {/* Gloss Effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:animate-[shimmer_1.5s_infinite]" />

                    {isSubmitting ? (
                        <>
                            <div className="w-4 h-4 border-2 border-app/30 border-t-app rounded-full animate-spin" />
                            <span>Initializing...</span>
                        </>
                    ) : (
                        <>
                            <Sparkles size={16} className={clsx(name.trim() && "animate-pulse")} />
                            <span>New Project</span>
                        </>
                    )}
                </button>
            </div>
        </form>
    );
};