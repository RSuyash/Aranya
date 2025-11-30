import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import clsx from 'clsx';
import type { BreadcrumbItem } from '../../context/HeaderContext';

interface BreadcrumbsProps {
    items: BreadcrumbItem[];
    isLoading?: boolean;
    accentColor?: string;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({
    items,
    isLoading = false,
    accentColor = 'text-primary'
}) => {

    if (isLoading) {
        return (
            <div className="flex items-center gap-2 animate-pulse">
                <div className="h-4 w-12 bg-panel-soft rounded" />
                <ChevronRight size={12} className="text-border" />
                <div className="h-4 w-24 bg-panel-soft rounded" />
            </div>
        );
    }

    if (items.length === 0) return null;

    return (
        <nav className="flex items-center gap-2 text-sm font-medium whitespace-nowrap overflow-hidden mask-linear-fade animate-in fade-in slide-in-from-left-2 duration-300">
            {items.map((crumb, index) => {
                const isLast = index === items.length - 1;

                return (
                    <React.Fragment key={index}>
                        {index > 0 && (
                            <ChevronRight size={14} className="text-text-muted/50 flex-shrink-0" strokeWidth={1.5} />
                        )}
                        {crumb.path && !isLast ? (
                            <Link
                                to={crumb.path}
                                className="text-text-muted hover:text-text-main transition-colors hover:underline decoration-border underline-offset-4"
                            >
                                {crumb.label}
                            </Link>
                        ) : (
                            <span className={clsx(
                                "transition-all duration-500",
                                isLast ? "font-bold" : "text-text-muted",
                                isLast && accentColor // Apply thematic color to current item
                            )}>
                                {crumb.label}
                            </span>
                        )}
                    </React.Fragment>
                );
            })}
        </nav>
    );
};