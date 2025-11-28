import React from 'react';
import { Lock, ArrowRight } from 'lucide-react';
import { clsx } from 'clsx';

interface ModuleCardProps {
    title: string;
    icon: React.ElementType;
    status: 'active' | 'coming-soon';
    progress?: number;
    count?: string;
    onClick: () => void;
    className?: string;
}

export const ModuleCard: React.FC<ModuleCardProps> = ({
    title,
    icon: Icon,
    status,
    progress = 0,
    count,
    onClick,
    className = ''
}) => {
    const isComingSoon = status === 'coming-soon';
    const isCompleted = progress === 100;

    // Clamp progress to valid range
    const validProgress = Math.min(Math.max(progress, 0), 100);

    return (
        <button
            onClick={onClick}
            className={clsx(
                "group relative flex w-full flex-col gap-4 overflow-hidden rounded-xl border p-5 text-left",
                "transition-[transform,colors,box-shadow,border-color,background-color] duration-300 ease-out",
                isComingSoon
                    ? "border-border bg-panel/50 cursor-not-allowed opacity-60"
                    : [
                        // Active Base
                        "border-border bg-panel cursor-pointer shadow-sm",
                        // Hover States
                        "hover:border-primary/30 hover:bg-panel-soft hover:shadow-lg hover:shadow-primary/10",
                        // Focus Visible (match hover visual)
                        "focus-visible:border-primary/30 focus-visible:bg-panel-soft focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                        // Active (Tactile Feedback)
                        "active:scale-[0.98]"
                    ],
                className
            )}
            disabled={isComingSoon}
        >
            {/* --- Element: Coming Soon Overlay --- */}
            {isComingSoon && (
                <div
                    className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-app/60 backdrop-blur-[2px] transition-opacity duration-300"
                    aria-hidden="true"
                >
                    <span className="sr-only">Module Coming Soon</span>

                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-panel border border-border">
                        <Lock className="h-5 w-5 text-text-muted" />
                    </div>
                    <span className="mt-3 text-xs font-medium uppercase tracking-widest text-text-muted">
                        Coming Soon
                    </span>
                </div>
            )}

            {/* --- Element: Header --- */}
            <div className="flex w-full items-start justify-between">
                <div className="space-y-1 pr-4">
                    <h3 className={clsx(
                        "text-lg font-semibold tracking-tight text-text-main transition-colors",
                        isComingSoon && "text-text-muted"
                    )}>
                        {title}
                    </h3>
                    {count && (
                        <p className={clsx(
                            "text-sm text-text-muted transition-colors",
                            isComingSoon && "text-text-muted/70"
                        )}>
                            {count}
                        </p>
                    )}
                </div>

                {/* Status Icon */}
                <div className={clsx("shrink-0 rounded-full p-2 transition-opacity", isComingSoon && "opacity-20")}>
                    <Icon className="h-6 w-6 text-primary" />
                </div>
            </div>

            {/* --- Element: Footer (Progress & CTA) --- */}
            {progress !== undefined && (
                <div className={clsx("mt-auto flex w-full items-center gap-4 pt-2 transition-all", isComingSoon && "opacity-20")}>
                    <div className="flex-1">
                        <div className="mb-1.5 flex justify-between text-xs text-text-muted">
                            <span aria-hidden="true">Progress</span>
                            <span className={clsx("font-medium", isCompleted && "text-success")}>
                                {isCompleted ? "Completed" : `${validProgress}%`}
                            </span>
                        </div>

                        {/* Progress Bar Container */}
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-text-muted/20">
                            <div
                                className={clsx(
                                    "h-full transition-all duration-700 ease-out",
                                    isCompleted ? "bg-success" : validProgress > 25 ? "bg-primary" : "bg-text-muted"
                                )}
                                style={{ width: `${validProgress}%` }}
                            />
                        </div>
                    </div>

                    {/* Call to Action Arrow (Hidden if coming soon) */}
                    {!isComingSoon && (
                        <div className={clsx(
                            "flex h-8 w-8 items-center justify-center rounded-full bg-panel-soft text-text-muted transition-all duration-300 border border-border",
                            // Arrow translates right and turns blue on hover/focus
                            "group-hover:translate-x-1 group-hover:bg-primary group-hover:text-white group-hover:border-primary group-hover:shadow-lg group-hover:shadow-primary/20",
                            "group-focus-visible:translate-x-1 group-focus-visible:bg-primary group-focus-visible:text-white"
                        )}>
                            <ArrowRight className="h-4 w-4" />
                        </div>
                    )}
                </div>
            )}
        </button>
    );
};