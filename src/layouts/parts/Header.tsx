import React from 'react';
import {
    MagnifyingGlass,
    Bell,
    CaretRight,
    Command,
    List
} from 'phosphor-react';
import { useLocation, Link } from 'react-router-dom';
import { SyncStatus } from '../components/SyncStatus';
import clsx from 'clsx';

interface HeaderProps {
    onMobileMenuToggle: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onMobileMenuToggle }) => {
    const location = useLocation();

    // Auto-generate breadcrumbs from path
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const breadcrumbs = pathSegments.map((segment, index) => {
        const path = `/${pathSegments.slice(0, index + 1).join('/')}`;
        return { label: segment.charAt(0).toUpperCase() + segment.slice(1), path };
    });

    return (
        <header className="h-16 flex-none flex items-center justify-between px-4 md:px-6 border-b border-white/5 bg-[#050814]/80 backdrop-blur-xl sticky top-0 z-30 transition-all">
            {/* Left: Mobile Toggle & Context */}
            <div className="flex items-center gap-4 flex-1 min-w-0">
                <button
                    onClick={onMobileMenuToggle}
                    className="md:hidden p-2 -ml-2 text-[#9ba2c0] hover:text-white rounded-lg active:scale-95 transition"
                >
                    <List size={20} />
                </button>

                {/* Breadcrumbs */}
                <nav className="hidden md:flex items-center gap-2 text-sm font-medium whitespace-nowrap overflow-hidden">
                    <Link to="/" className="text-[#9ba2c0] hover:text-[#56ccf2] transition-colors">
                        Terra
                    </Link>
                    {breadcrumbs.length > 0 && <CaretRight size={12} className="text-[#555b75]" />}

                    {breadcrumbs.map((crumb, idx) => (
                        <React.Fragment key={crumb.path}>
                            {idx > 0 && <CaretRight size={12} className="text-[#555b75]" />}
                            <Link
                                to={crumb.path}
                                className={clsx(
                                    "transition-colors",
                                    idx === breadcrumbs.length - 1 ? "text-[#f5f7ff]" : "text-[#9ba2c0] hover:text-[#56ccf2]"
                                )}
                            >
                                {crumb.label}
                            </Link>
                        </React.Fragment>
                    ))}
                </nav>

                {/* Mobile Title Fallback */}
                <span className="md:hidden font-semibold text-[#f5f7ff] truncate">
                    {breadcrumbs.length ? breadcrumbs[breadcrumbs.length-1].label : 'Dashboard'}
                </span>
            </div>

            {/* Center: Omni-Search */}
            <div className="hidden md:flex flex-1 max-w-lg mx-4">
                <button className="w-full flex items-center gap-3 bg-[#0b1020]/50 border border-white/5 hover:border-white/10 hover:bg-[#0b1020] text-[#9ba2c0] px-4 py-2 rounded-lg transition-all group shadow-inner shadow-black/20">
                    <MagnifyingGlass size={16} className="group-hover:text-[#56ccf2] transition-colors" />
                    <span className="text-xs">Search projects, plots, ID tags...</span>
                    <div className="ml-auto flex items-center gap-1 text-[10px] font-mono bg-white/5 px-1.5 py-0.5 rounded border border-white/5 text-[#555b75]">
                        <Command size={10} /> K
                    </div>
                </button>
            </div>

            {/* Right: System Status */}
            <div className="flex items-center gap-3 md:gap-6 justify-end flex-1">
                <div className="hidden md:block">
                    <SyncStatus status="SYNCED" />
                </div>

                <div className="h-6 w-px bg-white/10 hidden md:block" />

                <button className="relative text-[#9ba2c0] hover:text-[#f5f7ff] transition-colors">
                    <Bell size={20} />
                    <span className="absolute top-0 right-0 w-2 h-2 bg-[#ff7e67] rounded-full border-2 border-[#050814]" />
                </button>

                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#56ccf2] to-[#52d273] p-[1px] shadow-lg shadow-[#56ccf2]/20">
                    <div className="w-full h-full rounded-full bg-[#050814] flex items-center justify-center text-xs font-bold text-[#f5f7ff]">
                        JD
                    </div>
                </div>
            </div>
        </header>
    );
};