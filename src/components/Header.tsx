import React from 'react';
import { List, SidebarSimple, MagnifyingGlass, Bell } from 'phosphor-react';
import clsx from 'clsx';
import { useHeader } from '../context/HeaderContext';
import { Breadcrumbs } from './ui/Breadcrumbs';

import { ThemeToggle } from './ThemeToggle';

interface HeaderProps {
    onMobileMenuToggle?: () => void;
    onToggleSidebar?: () => void;
    collapsed?: boolean;
}

const MODULE_COLORS = {
    default: { border: 'border-border', text: 'text-primary' },
    emerald: { border: 'border-success/30', text: 'text-success' }, // Vegetation
    cyan: { border: 'border-primary/30', text: 'text-primary' },    // Water/General
    amber: { border: 'border-warning/30', text: 'text-warning' },    // Analysis
    rose: { border: 'border-danger/30', text: 'text-danger' },     // Alerts
    blue: { border: 'border-blue-500/30', text: 'text-blue-500' },     // Water Quality
    indigo: { border: 'border-indigo-500/30', text: 'text-indigo-500' },   // Research
    violet: { border: 'border-violet-500/30', text: 'text-violet-500' },   // System
};

export const Header: React.FC<HeaderProps> = ({
    onMobileMenuToggle,
    onToggleSidebar,
    collapsed
}) => {
    const { breadcrumbs, title, actions, status, moduleColor, isLoading } = useHeader();

    const theme = MODULE_COLORS[moduleColor] || MODULE_COLORS.default;

    return (
        <header className={clsx(
            "h-16 bg-app/90 backdrop-blur-xl sticky top-0 z-30 flex items-center justify-between px-4 md:px-6 shadow-2xl transition-colors duration-500 ease-in-out",
            "border-b", theme.border // Dynamic Border Color
        )}>
            {/* Left: Navigation & Breadcrumbs */}
            <div className="flex items-center gap-4 flex-1 overflow-hidden">
                <button onClick={onMobileMenuToggle} className="md:hidden p-2 -ml-2 text-text-muted">
                    <List size={20} />
                </button>
                <button onClick={onToggleSidebar} className="hidden md:flex p-2 -ml-2 text-text-muted hover:text-text-main">
                    <SidebarSimple size={20} weight={collapsed ? "fill" : "regular"} />
                </button>

                <div className="h-6 w-px bg-border hidden md:block" />

                {/* Context-Aware Title/Breadcrumbs */}
                {breadcrumbs.length > 0 || isLoading ? (
                    <Breadcrumbs items={breadcrumbs} isLoading={isLoading} accentColor={theme.text} />
                ) : (
                    <h2 className="text-base font-semibold text-text-main animate-in fade-in slide-in-from-left-2">{title}</h2>
                )}
            </div>

            {/* Center: Status Indicators (Scientific Priority) */}
            {status && (
                <div className="hidden md:flex items-center justify-center px-4 animate-in fade-in zoom-in duration-300">
                    <div className="bg-panel-soft border border-border rounded-full px-3 py-1 text-xs font-mono text-text-muted flex items-center gap-2">
                        {status}
                    </div>
                </div>
            )}

            {/* Right: Page Actions & Global Tools */}
            <div className="flex items-center gap-2 md:gap-4 justify-end flex-1">
                {/* Injected Page Actions */}
                <div className="flex items-center gap-2 mr-2 animate-in fade-in slide-in-from-right-4 duration-300">
                    {actions}
                </div>

                {/* Theme Toggle */}
                <ThemeToggle />

                {/* Global Search */}
                <button className="p-2 text-text-muted hover:text-text-main transition-colors">
                    <MagnifyingGlass size={20} />
                </button>

                <div className="h-6 w-px bg-border hidden md:block" />

                <button className="p-2 text-text-muted hover:text-text-main relative">
                    <Bell size={20} />
                    {/* Notification Dot */}
                    <span className="absolute top-2 right-2 w-2 h-2 bg-danger rounded-full" />
                </button>

                {/* User Profile */}
                <div className={clsx("w-8 h-8 rounded-full p-[1px] bg-gradient-to-tr transition-all duration-500",
                    moduleColor === 'emerald' ? "from-success to-[#21452b]" :
                        moduleColor === 'blue' ? "from-[#3b82f6] to-[#1e3a8a]" :
                            "from-primary to-success"
                )}>
                    <div className="w-full h-full rounded-full bg-panel flex items-center justify-center text-xs font-bold text-text-main">
                        JD
                    </div>
                </div>
            </div>
        </header>
    );
};