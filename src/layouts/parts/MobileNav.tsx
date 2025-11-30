import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutGrid, FolderOpen, Map as MapIcon, Settings, Plus } from 'lucide-react';
import clsx from 'clsx';

export const MobileNav: React.FC = () => {
    // Simplified mobile items for direct access
    const navItems = [
        { label: 'Mission', path: '/', icon: LayoutGrid },
        { label: 'Projects', path: '/projects', icon: FolderOpen },
        { label: 'Map', path: '/map', icon: MapIcon },
        { label: 'Settings', path: '/settings', icon: Settings },
    ];

    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-app/90 backdrop-blur-xl border-t border-border z-40 px-6 pt-2 pb-[max(1.5rem,env(safe-area-inset-bottom))] transition-all duration-300">
            <div className="flex items-center justify-between h-full">
                {navItems.map(item => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) => clsx(
                            "flex flex-col items-center gap-1 transition-all duration-200 active:scale-90 group",
                            isActive ? "text-primary" : "text-text-muted hover:text-text-main"
                        )}
                    >
                        <div className={clsx(
                            "p-1 rounded-lg transition-colors",
                            // Subtle active background for touch targets
                            ({ isActive }: { isActive: boolean }) => isActive ? "bg-primary/10" : "bg-transparent"
                        )}>
                            <item.icon
                                size={24}
                                strokeWidth={window.location.pathname === item.path ? 2.5 : 2}
                                className="transition-transform group-active:scale-95"
                            />
                        </div>
                        <span className="text-[10px] font-medium tracking-wide">{item.label}</span>
                    </NavLink>
                ))}

                {/* Floating Action Button (FAB) - Visual Anchor */}
                <button className="absolute -top-6 left-1/2 -translate-x-1/2 w-14 h-14 rounded-full bg-gradient-to-tr from-primary to-blue-600 flex items-center justify-center text-white shadow-xl shadow-primary/30 active:scale-90 transition-transform border-4 border-app">
                    <Plus size={28} strokeWidth={3} />
                </button>
            </div>
        </div>
    );
};