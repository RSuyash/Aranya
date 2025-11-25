import type React from 'react';
import { type IconProps } from 'phosphor-react';
import clsx from 'clsx';

interface ModuleCardProps {
    title: string;
    icon: React.ComponentType<IconProps>;
    status: 'active' | 'coming-soon' | 'locked';
    progress?: number;
    count?: string;
    onClick?: () => void;
}

export const ModuleCard: React.FC<ModuleCardProps> = ({
    title,
    icon: Icon,
    status,
    progress,
    count,
    onClick,
}) => {
    const isInteractive = status === 'active';

    return (
        <div
            onClick={isInteractive ? onClick : undefined}
            className={clsx(
                'glass-panel p-6 rounded-xl flex flex-col gap-4 transition-all duration-300 group relative overflow-hidden',
                isInteractive
                    ? 'hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 cursor-pointer'
                    : 'opacity-60 cursor-not-allowed grayscale'
            )}
        >
            {/* Background Glow */}
            {isInteractive && (
                <div className="absolute -right-10 -top-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-all" />
            )}

            <div className="flex items-start justify-between z-10">
                <div className={clsx(
                    'p-3 rounded-lg',
                    isInteractive ? 'bg-primary/10 text-primary' : 'bg-white/5 text-text-muted'
                )}>
                    <Icon size={32} weight="duotone" />
                </div>
                {status === 'coming-soon' && (
                    <span className="text-xs font-medium px-2 py-1 rounded-full bg-white/5 text-text-muted border border-white/10">
                        Coming Soon
                    </span>
                )}
            </div>

            <div className="z-10">
                <h3 className="text-lg font-semibold text-text-main">{title}</h3>
                {count && <p className="text-sm text-text-muted mt-1">{count}</p>}
            </div>

            {progress !== undefined && (
                <div className="mt-auto z-10">
                    <div className="flex justify-between text-xs mb-1">
                        <span className="text-text-muted">Progress</span>
                        <span className="text-primary font-medium">{progress}%</span>
                    </div>
                    <div className="h-1.5 bg-bg-app rounded-full overflow-hidden">
                        <div
                            className="h-full bg-primary rounded-full transition-all duration-500"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};
