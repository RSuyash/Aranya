import React from 'react';
import { List, Bell, SidebarSimple } from 'phosphor-react';

interface HeaderProps {
    title?: string;
    onMenuClick?: () => void;
    onToggleSidebar?: () => void;
    collapsed?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ title = 'Dashboard', onMenuClick, onToggleSidebar, collapsed }) => {
    return (
        <header className="h-16 bg-bg-app/80 backdrop-blur-md border-b border-border sticky top-0 z-20 flex items-center justify-between px-4 md:px-8 transition-all duration-300">
            <div className="flex items-center gap-4">
                {/* Mobile Menu Toggle */}
                <button
                    onClick={onMenuClick}
                    className="p-2 -ml-2 text-text-muted hover:text-text-main hover:bg-white/5 rounded-lg md:hidden transition-colors"
                >
                    <List size={24} />
                </button>

                {/* Desktop Sidebar Toggle */}
                <button
                    onClick={onToggleSidebar}
                    className="hidden md:flex p-2 -ml-2 text-text-muted hover:text-text-main hover:bg-white/5 rounded-lg transition-colors"
                    title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                >
                    <SidebarSimple size={24} weight={collapsed ? "fill" : "regular"} />
                </button>

                <h2 className="text-lg font-semibold text-text-main">{title}</h2>
            </div>

            <div className="flex items-center gap-4">
                <button className="p-2 text-text-muted hover:text-text-main hover:bg-panel-soft rounded-full transition-colors relative">
                    <Bell size={20} />
                    <span className="absolute top-2 right-2 w-2 h-2 bg-warning rounded-full border border-bg-panel"></span>
                </button>
            </div>
        </header>
    );
};
