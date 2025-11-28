import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { Header } from '../components/Header';
import { MobileNav } from './parts/MobileNav';
import { HeaderProvider, useHeader } from '../context/HeaderContext';
import clsx from 'clsx';

const AppContent: React.FC = () => {
    const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false);
    const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
    const location = useLocation();
    const { isFullScreen } = useHeader();

    useEffect(() => {
        setIsMobileDrawerOpen(false);
    }, [location.pathname]);

    return (
        // FIX: Use h-[100dvh] instead of h-screen. 
        // This accounts for mobile browser address bars shrinking/expanding.
        <div className="flex h-[100dvh] w-full bg-app text-text-main overflow-hidden selection:bg-primary/30 selection:text-primary">

            {/* Desktop Sidebar */}
            {!isFullScreen && (
                <div
                    className={clsx(
                        "hidden md:block h-full flex-shrink-0 z-40 transition-[width] duration-300 ease-[cubic-bezier(0.2,0,0,1)]",
                        isDesktopCollapsed ? "w-20" : "w-64"
                    )}
                >
                    <Sidebar collapsed={isDesktopCollapsed} />
                </div>
            )}

            {/* Mobile Drawer */}
            <div
                className={clsx(
                    "fixed inset-0 z-50 bg-black/80 backdrop-blur-sm md:hidden transition-opacity duration-300",
                    isMobileDrawerOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
                )}
                onClick={() => setIsMobileDrawerOpen(false)}
            >
                <div
                    className={clsx(
                        "absolute inset-y-0 left-0 w-72 transform transition-transform duration-300 ease-out bg-panel border-r border-border",
                        isMobileDrawerOpen ? "translate-x-0" : "-translate-x-full"
                    )}
                    onClick={e => e.stopPropagation()}
                >
                    <Sidebar collapsed={false} />
                </div>
            </div>

            {/* Main Content */}
            {/* FIX: Added min-w-0 to prevent flex blowout */}
            <div className="flex-1 flex flex-col min-w-0 min-h-0 relative transition-all duration-300">

                {!isFullScreen && (
                    <Header
                        onMobileMenuToggle={() => setIsMobileDrawerOpen(true)}
                        onToggleSidebar={() => setIsDesktopCollapsed(!isDesktopCollapsed)}
                        collapsed={isDesktopCollapsed}
                    />
                )}

                {/* FIX: Added min-h-0 to ensure this container shrinks to fit, enabling scroll */}
                <main className={clsx(
                    "flex-1 min-h-0 overflow-y-auto overflow-x-hidden scroll-smooth scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10",
                    !isFullScreen && "pb-24 md:pb-8"
                )}>
                    <div className={clsx(
                        "w-full max-w-[1920px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500",
                        !isFullScreen && "p-4 md:p-8"
                    )}>
                        <Outlet />
                    </div>
                </main>

                {!isFullScreen && <MobileNav />}
            </div>
        </div>
    );
};

export const MainLayout: React.FC = () => {
    return (
        <HeaderProvider>
            <AppContent />
        </HeaderProvider>
    );
};