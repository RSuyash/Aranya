import React from 'react';
import {
    List,
    Bell,
    SidebarSimple,
    MagnifyingGlass,
    CaretRight,
    Command,
    Question
} from 'phosphor-react';
import clsx from 'clsx';
import { Link } from 'react-router-dom';

interface HeaderProps {
    title?: string;
    breadcrumbs?: { label: string; path?: string }[];
    onMenuClick?: () => void;
    onToggleSidebar?: () => void;
    collapsed?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
    title,
    breadcrumbs = [],
    onMenuClick,
    onToggleSidebar,
    collapsed
}) => {
    // If no breadcrumbs provided, try to auto-generate or use title
    const displayTitle = title || 'Dashboard';

    return (
        <header className="h-16 bg-[#050814]/80 backdrop-blur-xl border-b border-white/5 sticky top-0 z-30 flex items-center justify-between px-4 md:px-6 transition-all duration-300 shadow-2xl shadow-black/20">
            {/* Left Section: Navigation Controls & Context */}
            <div className="flex items-center gap-4 flex-1 overflow-hidden">
                {/* Mobile Menu Toggle */}
                <button
                    onClick={onMenuClick}
                    className="p-2 -ml-2 text-[#9ba2c0] hover:text-[#f5f7ff] hover:bg-white/5 rounded-lg md:hidden transition-all active:scale-95"
                >
                    <List size={20} weight="bold" />
                </button>

                {/* Desktop Sidebar Toggle */}
                <button
                    onClick={onToggleSidebar}
                    className="hidden md:flex p-2 -ml-2 text-[#9ba2c0] hover:text-[#f5f7ff] hover:bg-white/5 rounded-lg transition-all active:scale-95"
                    title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                >
                    <SidebarSimple size={20} weight={collapsed ? "fill" : "regular"} />
                </button>

                {/* Vertical Divider */}
                <div className="h-6 w-px bg-white/10 hidden md:block" />

                {/* Breadcrumbs / Title Area */}
                <nav className="flex items-center gap-2 text-sm font-medium whitespace-nowrap overflow-hidden mask-linear-fade">
                    {breadcrumbs.length > 0 ? (
                        breadcrumbs.map((crumb, index) => (
                            <React.Fragment key={index}>
                                {index > 0 && (
                                    <CaretRight size={12} className="text-[#555b75] flex-shrink-0" />
                                )}
                                {crumb.path ? (
                                    <Link
                                        to={crumb.path}
                                        className="text-[#9ba2c0] hover:text-[#56ccf2] transition-colors"
                                    >
                                        {crumb.label}
                                    </Link>
                                ) : (
                                    <span className={clsx(
                                        index === breadcrumbs.length - 1 ? "text-[#f5f7ff]" : "text-[#9ba2c0]"
                                    )}>
                                        {crumb.label}
                                    </span>
                                )}
                            </React.Fragment>
                        ))
                    ) : (
                        <h2 className="text-base font-semibold text-[#f5f7ff] tracking-tight">{displayTitle}</h2>
                    )}
                </nav>
            </div>

            {/* Center Section: Global Search (Optional but high-value UX) */}
            <div className="hidden md:flex items-center justify-center flex-1 max-w-md mx-4">
                <button className="w-full flex items-center gap-3 bg-[#0b1020]/50 border border-white/5 hover:border-white/10 hover:bg-[#0b1020] text-[#9ba2c0] px-4 py-2 rounded-lg transition-all group group-hover:shadow-lg group-hover:shadow-[#56ccf2]/5">
                    <MagnifyingGlass size={16} className="group-hover:text-[#56ccf2] transition-colors" />
                    <span className="text-xs">Search projects, plots, species...</span>
                    <div className="ml-auto flex items-center gap-1 text-[10px] font-mono bg-white/5 px-1.5 py-0.5 rounded border border-white/5 text-[#555b75]">
                        <Command size={10} /> K
                    </div>
                </button>
            </div>

            {/* Right Section: Actions & Profile */}
            <div className="flex items-center gap-2 md:gap-4 justify-end flex-1">
                {/* Help Trigger */}
                <button className="hidden md:flex p-2 text-[#9ba2c0] hover:text-[#f5f7ff] hover:bg-white/5 rounded-full transition-colors">
                    <Question size={20} />
                </button>

                {/* Notifications */}
                <button className="p-2 text-[#9ba2c0] hover:text-[#f5f7ff] hover:bg-white/5 rounded-full transition-colors relative group">
                    <Bell size={20} weight={true ? "regular" : "fill"} /> {/* Conditional weight example */}

                    {/* Pulsing Badge */}
                    <span className="absolute top-2 right-2 flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ff7e67] opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#ff7e67] border-2 border-[#050814]"></span>
                    </span>
                </button>

                {/* Mobile Profile Avatar (If Sidebar is hidden/overlay) */}
                <div className="md:hidden w-8 h-8 rounded-full bg-gradient-to-tr from-[#56ccf2] to-[#52d273] p-[1px]">
                    <div className="w-full h-full rounded-full bg-[#0b1020] flex items-center justify-center text-xs font-bold text-[#f5f7ff]">
                        JD
                    </div>
                </div>
            </div>
        </header>
    );
};