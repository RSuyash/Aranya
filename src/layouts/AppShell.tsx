import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
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
        // The background is handled by body in index.css, ensuring seamless gradient
        <div className="flex h-screen w-full overflow-hidden text-text-main">

            {/* Mobile Sidebar Overlay */}
            <div
                className={clsx(
                    "fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 md:hidden",
                    isMobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
                )}
                onClick={() => setIsMobileMenuOpen(false)}
            />

            {/* Sidebar Container */}
            <div className={clsx(
                "fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 h-full",
                isMobileMenuOpen ? "translate-x-0" : "-translate-x-full",
                isDesktopCollapsed ? "md:w-20" : "md:w-64",
                "w-72" // Mobile drawer width
            )}>
                <Sidebar
                    collapsed={isDesktopCollapsed}
                    mobile={isMobileMenuOpen} // Only true on mobile drawer
                />
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 h-full relative">
                <Header
                    onMobileMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    onToggleSidebar={() => setIsDesktopCollapsed(!isDesktopCollapsed)}
                    collapsed={isDesktopCollapsed}
                />

                {/* Scrollable Content */}
                <main className="flex-1 overflow-y-auto scroll-smooth w-full">
                    <div className="max-w-[1600px] mx-auto p-4 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <Outlet />
                    </div>
                    <Footer />
                </main>
            </div>
        </div>
    );
};