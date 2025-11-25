import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './parts/Sidebar';
import { Header } from './parts/Header';
import { MobileNav } from './parts/MobileNav';
import clsx from 'clsx';

export const MainLayout: React.FC = () => {
    const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
    const location = useLocation();

    React.useEffect(() => {
        setIsMobileDrawerOpen(false);
    }, [location.pathname]);

    return (
        <div className="flex h-screen w-full bg-[#050814] text-[#f5f7ff] overflow-hidden selection:bg-[#56ccf2]/30 selection:text-[#56ccf2]">

            {/* Desktop Sidebar */}
            <div className="hidden md:block w-64 h-full flex-shrink-0 z-40">
                <Sidebar className="w-full h-full" />
            </div>

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
                    <Sidebar className="w-full h-full border-r border-white/10 shadow-2xl" />
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0 relative">
                <Header onMobileMenuToggle={() => setIsMobileDrawerOpen(true)} />

                <main className="flex-1 overflow-y-auto overflow-x-hidden scroll-smooth scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
                    <div className="w-full max-w-[1920px] mx-auto p-4 md:p-8 pb-24 md:pb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <Outlet />
                    </div>
                </main>

                <MobileNav />
            </div>
        </div>
    );
};