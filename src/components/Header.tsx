import React from 'react';
import {
    Menu,
    PanelLeftClose,
    PanelLeftOpen,
    Search,
    Bell,
    User,
    Wifi,
    ChevronRight
} from 'lucide-react'; // Switched to Lucide for System Unity
import clsx from 'clsx';
import { useHeader, type BreadcrumbItem } from '../context/HeaderContext';
import { Link } from 'react-router-dom';
import { ThemeToggle } from './ThemeToggle';

interface HeaderProps {
    onMobileMenuToggle?: () => void;
    onToggleSidebar?: () => void;
    collapsed?: boolean;
}

// --- OPTICAL BREADCRUMBS ---
// We extract this to keep the main component clean and chemically pure.
const Breadcrumbs: React.FC<{ items: BreadcrumbItem[], accentColor: string, isLoading: boolean }> = ({
    items, accentColor, isLoading
}) => {
    if (isLoading) {
        return (
            <div className="flex items-center gap-2 animate-pulse">
                <div className="h-4 w-12 bg-panel-soft rounded-md" />
                <ChevronRight size={12} className="text-border" />
                <div className="h-4 w-24 bg-panel-soft rounded-md" />
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
                                className="text-text-muted hover:text-text-main transition-colors decoration-transparent hover:decoration-primary/30 underline-offset-4"
                            >
                                {crumb.label}
                            </Link>
                        ) : (
                            <span className={clsx(
                                "transition-all duration-500 font-bold tracking-wide",
                                isLast ? accentColor : "text-text-muted"
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

// --- THEME ENGINE ---
// Maps internal module context to our new OKLCH semantics
const MODULE_THEMES: Record<string, { accent: string, border: string, glow: string, indicator: string }> = {
    default: {
        accent: 'text-primary',
        border: 'border-primary/20',
        glow: 'shadow-primary/5',
        indicator: 'bg-primary'
    },
    emerald: {
        accent: 'text-success',
        border: 'border-success/20',
        glow: 'shadow-success/5',
        indicator: 'bg-success'
    },
    cyan: {
        accent: 'text-[#56ccf2]', // Keep spec until variable migration
        border: 'border-[#56ccf2]/20',
        glow: 'shadow-[#56ccf2]/5',
        indicator: 'bg-[#56ccf2]'
    },
    amber: {
        accent: 'text-warning',
        border: 'border-warning/20',
        glow: 'shadow-warning/5',
        indicator: 'bg-warning'
    },
    rose: {
        accent: 'text-danger',
        border: 'border-danger/20',
        glow: 'shadow-danger/5',
        indicator: 'bg-danger'
    },
    // Fallbacks map to Primary to maintain "Void" consistency
    blue: { accent: 'text-primary', border: 'border-primary/20', glow: 'shadow-primary/5', indicator: 'bg-primary' },
    indigo: { accent: 'text-primary', border: 'border-primary/20', glow: 'shadow-primary/5', indicator: 'bg-primary' },
    violet: { accent: 'text-primary', border: 'border-primary/20', glow: 'shadow-primary/5', indicator: 'bg-primary' },
};

export const Header: React.FC<HeaderProps> = ({
    onMobileMenuToggle,
    onToggleSidebar,
    collapsed
}) => {
    const { breadcrumbs, title, actions, status, moduleColor, isLoading } = useHeader();
    const theme = MODULE_THEMES[moduleColor] || MODULE_THEMES.default;

    return (
        <header className="sticky top-0 z-40 w-full">

            {/* 1. The "Halo" - Top ambient light strip */}
            <div className={clsx(
                "absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-current to-transparent opacity-30",
                theme.accent
            )} />

            {/* 2. Glass Structure */}
            <div className={clsx(
                "h-16 px-4 md:px-6 flex items-center justify-between gap-4 transition-all duration-300",
                "bg-app/80 backdrop-blur-2xl border-b border-border",
                theme.glow // Subtle colored atmospheric scatter
            )}>

                {/* --- LEFT: NAVIGATION & CONTEXT --- */}
                <div className="flex items-center gap-4 min-w-0 flex-1">

                    {/* Tactile Sidebar Controls */}
                    <div className="flex items-center gap-1">
                        <button
                            onClick={onMobileMenuToggle}
                            className="md:hidden w-9 h-9 flex items-center justify-center rounded-xl text-text-muted hover:text-text-main hover:bg-panel-soft transition-all active:scale-95"
                        >
                            <Menu size={20} />
                        </button>
                        <button
                            onClick={onToggleSidebar}
                            className={clsx(
                                "hidden md:flex w-9 h-9 items-center justify-center rounded-xl transition-all active:scale-95",
                                "text-text-muted hover:text-text-main hover:bg-panel-soft",
                                collapsed && "text-primary bg-primary/10"
                            )}
                            title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                        >
                            {collapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
                        </button>
                    </div>

                    {/* Divider - Vertical Rhythm */}
                    <div className="h-5 w-px bg-border/50 hidden md:block" />

                    {/* Context Awareness */}
                    <div className="flex flex-col justify-center min-w-0">
                        {breadcrumbs.length > 0 ? (
                            <Breadcrumbs items={breadcrumbs} isLoading={isLoading} accentColor={theme.accent} />
                        ) : (
                            <h2 className="text-sm font-bold text-text-main tracking-wide uppercase animate-in fade-in slide-in-from-left-2">
                                {title}
                            </h2>
                        )}
                    </div>
                </div>

                {/* --- CENTER: STATUS MONITOR --- */}
                {status && (
                    <div className="hidden lg:flex items-center justify-center animate-in fade-in zoom-in duration-300">
                        <div className={clsx(
                            "flex items-center gap-2 px-3 py-1.5 rounded-full border bg-panel/50 backdrop-blur-md shadow-sm",
                            theme.border
                        )}>
                            {/* The "Pulse" of the system */}
                            <span className="relative flex h-2 w-2">
                                <span className={clsx("animate-ping absolute inline-flex h-full w-full rounded-full opacity-75", theme.indicator)}></span>
                                <span className={clsx("relative inline-flex rounded-full h-2 w-2", theme.indicator)}></span>
                            </span>

                            {/* We clone the status element to inject our class logic if it's a simple string, 
                                otherwise we trust the component passed */}
                            <div className={clsx("text-[10px] font-bold uppercase tracking-wider", theme.accent)}>
                                {status}
                            </div>
                        </div>
                    </div>
                )}

                {/* --- RIGHT: TOOLBELT --- */}
                <div className="flex items-center justify-end gap-3 flex-1">

                    {/* Action Injection Slot (Contextual Buttons) */}
                    {actions && (
                        <div className="flex items-center gap-2 mr-2 animate-in fade-in slide-in-from-right-4">
                            {actions}
                        </div>
                    )}

                    {/* System Controls */}
                    <div className="flex items-center gap-1 bg-panel border border-border rounded-full p-1 shadow-sm">
                        <ThemeToggle />

                        <button className="w-8 h-8 flex items-center justify-center rounded-full text-text-muted hover:text-primary hover:bg-panel-soft transition-colors" title="Global Search (Cmd+K)">
                            <Search size={16} strokeWidth={2} />
                        </button>
                    </div>

                    {/* Notifications (The "Alert" Node) */}
                    <button className="relative w-10 h-10 flex items-center justify-center rounded-xl border border-transparent hover:border-border hover:bg-panel-soft transition-all group">
                        <Bell size={20} className="text-text-muted group-hover:text-text-main transition-colors" />
                        <span className="absolute top-2.5 right-3 w-2 h-2 bg-danger rounded-full ring-2 ring-bg-app animate-pulse" />
                    </button>

                    {/* User Node */}
                    <div className="flex items-center gap-3 pl-2 border-l border-border/50">
                        <div className="text-right hidden xl:block leading-tight">
                            <div className="text-xs font-bold text-text-main">Operative</div>
                            <div className="text-[9px] text-text-muted font-mono uppercase tracking-wider flex items-center justify-end gap-1">
                                <Wifi size={10} className="text-success" strokeWidth={3} /> Signal Strong
                            </div>
                        </div>

                        <div className={clsx(
                            "relative w-9 h-9 rounded-xl flex items-center justify-center border transition-all duration-300 overflow-hidden cursor-pointer",
                            "bg-gradient-to-br from-panel to-panel-soft",
                            "border-border group-hover:border-primary/50"
                        )}>
                            <User size={18} className="text-text-main group-hover:text-primary transition-colors" strokeWidth={2} />
                        </div>
                    </div>

                </div>
            </div>
        </header>
    );
};