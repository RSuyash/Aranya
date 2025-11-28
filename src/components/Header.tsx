import React from 'react';
import { List, SidebarSimple, MagnifyingGlass, Bell, User, WifiHigh } from 'phosphor-react';
import clsx from 'clsx';
import { useHeader } from '../context/HeaderContext';
import { Breadcrumbs } from './ui/Breadcrumbs';
import { ThemeToggle } from './ThemeToggle';

interface HeaderProps {
    onMobileMenuToggle?: () => void;
    onToggleSidebar?: () => void;
    collapsed?: boolean;
}

// Visual Themes: Mapped to the CSS Variables and specific glow effects
const MODULE_THEMES = {
    default: {
        accent: 'text-primary',
        border: 'border-border',
        glow: 'shadow-primary/5',
        gradient: 'from-primary/0 via-primary/30 to-primary/0'
    },
    emerald: {
        accent: 'text-success',
        border: 'border-success/20',
        glow: 'shadow-success/10',
        gradient: 'from-success/0 via-success/30 to-success/0'
    },
    cyan: {
        accent: 'text-[#56ccf2]',
        border: 'border-[#56ccf2]/20',
        glow: 'shadow-[#56ccf2]/10',
        gradient: 'from-[#56ccf2]/0 via-[#56ccf2]/30 to-[#56ccf2]/0'
    },
    amber: {
        accent: 'text-warning',
        border: 'border-warning/20',
        glow: 'shadow-warning/10',
        gradient: 'from-warning/0 via-warning/30 to-warning/0'
    },
    rose: {
        accent: 'text-danger',
        border: 'border-danger/20',
        glow: 'shadow-danger/10',
        gradient: 'from-danger/0 via-danger/30 to-danger/0'
    },
    blue: {
        accent: 'text-blue-500',
        border: 'border-blue-500/20',
        glow: 'shadow-blue-500/10',
        gradient: 'from-blue-500/0 via-blue-500/30 to-blue-500/0'
    },
    indigo: {
        accent: 'text-indigo-500',
        border: 'border-indigo-500/20',
        glow: 'shadow-indigo-500/10',
        gradient: 'from-indigo-500/0 via-indigo-500/30 to-indigo-500/0'
    },
    violet: {
        accent: 'text-violet-500',
        border: 'border-violet-500/20',
        glow: 'shadow-violet-500/10',
        gradient: 'from-violet-500/0 via-violet-500/30 to-violet-500/0'
    },
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

            {/* 1. Ambient Glow Line (Top Border) */}
            <div className={clsx("absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r opacity-50", theme.gradient)} />

            {/* 2. Glass Container */}
            <div className={clsx(
                "h-16 px-4 md:px-6 flex items-center justify-between gap-4 transition-all duration-300",
                "bg-app/80 backdrop-blur-xl border-b border-white/5",
                theme.glow // Subtle colored shadow based on module
            )}>

                {/* --- LEFT: NAVIGATION & CONTEXT --- */}
                <div className="flex items-center gap-4 min-w-0 flex-1">

                    {/* Sidebar Toggles (Tactile Buttons) */}
                    <div className="flex items-center gap-1">
                        <button
                            onClick={onMobileMenuToggle}
                            className="md:hidden w-8 h-8 flex items-center justify-center rounded-lg text-text-muted hover:text-text-main hover:bg-white/5 transition-colors"
                        >
                            <List size={20} />
                        </button>
                        <button
                            onClick={onToggleSidebar}
                            className={clsx(
                                "hidden md:flex w-8 h-8 items-center justify-center rounded-lg transition-colors",
                                "text-text-muted hover:text-text-main hover:bg-white/5",
                                collapsed && "text-primary bg-primary/10"
                            )}
                            title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                        >
                            <SidebarSimple size={20} weight={collapsed ? "fill" : "regular"} />
                        </button>
                    </div>

                    {/* Separator */}
                    <div className="h-6 w-px bg-white/10 hidden md:block" />

                    {/* Breadcrumbs / Title Area */}
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

                {/* --- CENTER: STATUS MONITOR (Optional) --- */}
                {status && (
                    <div className="hidden lg:flex items-center justify-center animate-in fade-in zoom-in duration-300">
                        <div className={clsx(
                            "flex items-center gap-2 px-3 py-1.5 rounded-full border bg-panel/50 backdrop-blur-md",
                            theme.border
                        )}>
                            {/* Blinking Status Dot */}
                            <span className={clsx("relative flex h-2 w-2")}>
                                <span className={clsx("animate-ping absolute inline-flex h-full w-full rounded-full opacity-75", theme.accent.replace('text-', 'bg-'))}></span>
                                <span className={clsx("relative inline-flex rounded-full h-2 w-2", theme.accent.replace('text-', 'bg-'))}></span>
                            </span>
                            <span className={clsx("text-[10px] font-bold uppercase tracking-wider", theme.accent)}>
                                {status}
                            </span>
                        </div>
                    </div>
                )}

                {/* --- RIGHT: ACTIONS & TOOLS --- */}
                <div className="flex items-center justify-end gap-3 flex-1">

                    {/* Injected Page Actions */}
                    {actions && (
                        <div className="flex items-center gap-2 mr-2 animate-in fade-in slide-in-from-right-4">
                            {actions}
                        </div>
                    )}

                    {/* Control Cluster: Theme & Search */}
                    <div className="flex items-center gap-1 bg-white/5 rounded-full p-1 border border-white/5">
                        <ThemeToggle />

                        <button className="w-8 h-8 flex items-center justify-center rounded-full text-text-muted hover:text-text-main hover:bg-white/5 transition-colors" title="Search (Cmd+K)">
                            <MagnifyingGlass size={18} />
                        </button>
                    </div>

                    {/* Notifications */}
                    <button className="relative w-9 h-9 flex items-center justify-center rounded-full border border-white/5 hover:bg-white/5 transition-colors group">
                        <Bell size={18} className="text-text-muted group-hover:text-text-main" />
                        <span className="absolute top-2 right-2.5 w-1.5 h-1.5 bg-danger rounded-full ring-2 ring-app" />
                    </button>

                    {/* Separator */}
                    <div className="h-6 w-px bg-white/10" />

                    {/* User Profile Badge */}
                    <div className="flex items-center gap-3 pl-1 cursor-pointer group">
                        <div className="text-right hidden xl:block">
                            <div className="text-xs font-bold text-text-main group-hover:text-primary transition-colors">Jane Doe</div>
                            <div className="text-[9px] text-text-muted font-mono uppercase tracking-wider flex items-center justify-end gap-1">
                                <WifiHigh size={10} className="text-success" /> Online
                            </div>
                        </div>

                        <div className={clsx(
                            "relative w-9 h-9 rounded-xl flex items-center justify-center border transition-all duration-300",
                            "bg-gradient-to-b from-white/10 to-white/5",
                            "border-white/10 group-hover:border-primary/50 group-hover:shadow-[0_0_15px_rgba(56,189,248,0.3)]"
                        )}>
                            <User size={18} weight="duotone" className="text-text-main group-hover:text-primary transition-colors" />
                            {/* Online Status Dot */}
                            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-app rounded-full flex items-center justify-center">
                                <div className="w-1.5 h-1.5 bg-success rounded-full animate-pulse" />
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </header>
    );
};