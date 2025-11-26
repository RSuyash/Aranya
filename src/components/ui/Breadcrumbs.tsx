import React from 'react';
import { Link } from 'react-router-dom';
import { CaretRight } from 'phosphor-react';
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
    accentColor = 'text-[#56ccf2]' // Default Cyan
}) => {

    if (isLoading) {
        return (
            <div className="flex items-center gap-2 animate-pulse">
                <div className="h-4 w-12 bg-white/10 rounded" />
                <CaretRight size={12} className="text-[#555b75]" />
                <div className="h-4 w-24 bg-white/10 rounded" />
                <CaretRight size={12} className="text-[#555b75]" />
                <div className="h-4 w-32 bg-white/10 rounded" />
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
                            <CaretRight size={12} className="text-[#555b75] flex-shrink-0" />
                        )}
                        {crumb.path && !isLast ? (
                            <Link
                                to={crumb.path}
                                className="text-[#9ba2c0] hover:text-[#f5f7ff] transition-colors hover:underline decoration-white/20 underline-offset-4"
                            >
                                {crumb.label}
                            </Link>
                        ) : (
                            <span className={clsx(
                                "transition-all duration-500",
                                isLast ? "text-[#f5f7ff] font-semibold" : "text-[#9ba2c0]",
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
