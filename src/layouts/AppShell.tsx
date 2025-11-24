import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { Header } from '../components/Header';
import clsx from 'clsx';

export const AppShell: React.FC = () => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false);
    const location = useLocation();

    // Close mobile menu on route change
    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [location.pathname]);

    return (
        <div className="min-h-screen bg-bg-app text-text-main font-sans flex overflow-hidden">
            {/* Mobile Sidebar Overlay */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm animate-in fade-in"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar Container */}
            <div className={clsx(
                "fixed md:static inset-y-0 left-0 z-50 h-full transform transition-all duration-300 ease-in-out",
                isMobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
                isDesktopCollapsed ? "md:w-20" : "md:w-64",
                "w-64" // Mobile width is always fixed
            )}>

                <Sidebar
                    collapsed={isDesktopCollapsed}
                    onToggleCollapse={() => setIsDesktopCollapsed(!isDesktopCollapsed)}
                />
            </div>

            {/* Main Content Area */}
            <div className="flex-1 min-w-0 h-full overflow-y-auto scroll-smooth relative">
                <Header
                    onMenuClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    onToggleSidebar={() => setIsDesktopCollapsed(!isDesktopCollapsed)}
                    collapsed={isDesktopCollapsed}
                />

                <main className="p-4 md:p-8 max-w-7xl mx-auto w-full animate-in fade-in duration-500 pb-20">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};
