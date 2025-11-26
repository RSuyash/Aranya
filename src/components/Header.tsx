import React from 'react';
import { List, SidebarSimple, MagnifyingGlass, Bell } from 'phosphor-react';
import clsx from 'clsx';
import { useHeader } from '../context/HeaderContext';
import { Breadcrumbs } from './ui/Breadcrumbs';

interface HeaderProps {
    onMobileMenuToggle?: () => void;
    onToggleSidebar?: () => void;
    collapsed?: boolean;
}

const MODULE_COLORS = {
    default: { border: 'border-white/5', text: 'text-[#56ccf2]' },
    emerald: { border: 'border-[#52d273]/30', text: 'text-[#52d273]' }, // Vegetation
    cyan: { border: 'border-[#56ccf2]/30', text: 'text-[#56ccf2]' },    // Water/General
    amber: { border: 'border-[#f2c94c]/30', text: 'text-[#f2c94c]' },    // Analysis
    rose: { border: 'border-[#ff7e67]/30', text: 'text-[#ff7e67]' },     // Alerts
    blue: { border: 'border-[#3b82f6]/30', text: 'text-[#3b82f6]' },     // Water Quality
    indigo: { border: 'border-[#6366f1]/30', text: 'text-[#6366f1]' },   // Research
    violet: { border: 'border-[#8b5cf6]/30', text: 'text-[#8b5cf6]' },   // System
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
            "h-16 bg-[#050814]/90 backdrop-blur-xl sticky top-0 z-30 flex items-center justify-between px-4 md:px-6 shadow-2xl transition-colors duration-500 ease-in-out",
            "border-b", theme.border // Dynamic Border Color
        )}>
            {/* Left: Navigation & Breadcrumbs */}
            <div className="flex items-center gap-4 flex-1 overflow-hidden">
                <button onClick={onMobileMenuToggle} className="md:hidden p-2 -ml-2 text-[#9ba2c0]">
                    <List size={20} />
                </button>
                <button onClick={onToggleSidebar} className="hidden md:flex p-2 -ml-2 text-[#9ba2c0] hover:text-white">
                    <SidebarSimple size={20} weight={collapsed ? "fill" : "regular"} />
                </button>

                <div className="h-6 w-px bg-white/10 hidden md:block" />

                {/* Context-Aware Title/Breadcrumbs */}
                {breadcrumbs.length > 0 || isLoading ? (
                    <Breadcrumbs items={breadcrumbs} isLoading={isLoading} accentColor={theme.text} />
                ) : (
                    <h2 className="text-base font-semibold text-[#f5f7ff] animate-in fade-in slide-in-from-left-2">{title}</h2>
                )}
            </div>

            {/* Center: Status Indicators (Scientific Priority) */}
            {status && (
                <div className="hidden md:flex items-center justify-center px-4 animate-in fade-in zoom-in duration-300">
                    <div className="bg-[#11182b] border border-white/10 rounded-full px-3 py-1 text-xs font-mono text-[#9ba2c0] flex items-center gap-2">
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

                {/* Global Search */}
                <button className="p-2 text-[#9ba2c0] hover:text-white transition-colors">
                    <MagnifyingGlass size={20} />
                </button>

                <div className="h-6 w-px bg-white/10 hidden md:block" />

                <button className="p-2 text-[#9ba2c0] hover:text-white relative">
                    <Bell size={20} />
                    {/* Notification Dot */}
                    <span className="absolute top-2 right-2 w-2 h-2 bg-[#ff7e67] rounded-full" />
                </button>

                {/* User Profile */}
                <div className={clsx("w-8 h-8 rounded-full p-[1px] bg-gradient-to-tr transition-all duration-500",
                    moduleColor === 'emerald' ? "from-[#52d273] to-[#21452b]" :
                        moduleColor === 'blue' ? "from-[#3b82f6] to-[#1e3a8a]" :
                            "from-[#56ccf2] to-[#52d273]"
                )}>
                    <div className="w-full h-full rounded-full bg-[#0b1020] flex items-center justify-center text-xs font-bold text-white">
                        JD
                    </div>
                </div>
            </div>
        </header>
    );
};