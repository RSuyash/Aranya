import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './parts/Sidebar';
import { Header } from '../components/Header';
import { MobileNav } from './parts/MobileNav';
// Make sure to import useHeader inside the child component or split context
import { HeaderProvider, useHeader } from '../context/HeaderContext';
import clsx from 'clsx';

// Inner component to consume context
const AppContent: React.FC = () => {
    const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
    const location = useLocation();

    // CONSUME THE NEW CONTEXT
    const { isFullScreen } = useHeader();

    React.useEffect(() => {
        setIsMobileDrawerOpen(false);
    }, [location.pathname]);

    return (
        <div className="flex h-screen w-full bg-app text-text-main overflow-hidden selection:bg-primary/30 selection:text-primary">

            {/* Desktop Sidebar - Hide if FullScreen */}
            {!isFullScreen && (
                <div className="hidden md:block w-64 h-full flex-shrink-0 z-40">
                    <Sidebar className="w-full h-full" />
                </div>
            )}

            {/* Mobile Sidebar Drawer */}
            <div
                className={clsx(
                    "fixed inset-0 z-50 bg-black/60 backdrop-blur-sm md:hidden transition-opacity duration-300",
                    isMobileDrawerOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
                )}
                onClick={() => setIsMobileDrawerOpen(false)}
            >
                <div
                    className={clsx(
                        "absolute inset-y-0 left-0 w-72 transform transition-transform duration-300 ease-out",
                        isMobileDrawerOpen ? "translate-x-0" : "-translate-x-full"
                    )}
                    onClick={e => e.stopPropagation()}
                >
                    <Sidebar className="w-full h-full border-r border-border shadow-2xl" />
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0 relative">
                {/* Hide Header in FullScreen Mode? Optional. Keeping it for "Back" button context usually good. */}
                {!isFullScreen && (
                    <Header onMobileMenuToggle={() => setIsMobileDrawerOpen(true)} />
                )}

                <main className={clsx(
                    "flex-1 overflow-y-auto overflow-x-hidden scroll-smooth scrollbar-thin scrollbar-track-transparent scrollbar-thumb-border",
                    // Remove padding bottom if in full screen mode
                    !isFullScreen && "pb-24 md:pb-8"
                )}>
                    <div className={clsx(
                        "w-full max-w-[1920px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500",
                        !isFullScreen && "p-4 md:p-8" // Remove padding in full screen to let wizard control edges
                    )}>
                        <Outlet />
                    </div>
                </main>

                {/* THE FIX: Conditionally Render Mobile Nav */}
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