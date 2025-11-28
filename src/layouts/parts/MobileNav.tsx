import React from 'react';
import { NavLink } from 'react-router-dom';
import { NAV_ITEMS } from '../config';
import { Plus } from 'phosphor-react';
import clsx from 'clsx';

export const MobileNav: React.FC = () => {
    // Only show primary items on mobile bottom bar
    const mobileItems = NAV_ITEMS.filter(i => ['/', '/projects', '/map', '/settings'].includes(i.path));

    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 h-20 bg-app/90 backdrop-blur-xl border-t border-border z-50 px-6 pb-6 pt-2">
            <div className="flex items-center justify-between h-full">
                {mobileItems.map(item => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) => clsx(
                            "flex flex-col items-center gap-1 transition-all duration-200 active:scale-90",
                            isActive ? "text-primary" : "text-text-muted hover:text-text-main"
                        )}
                    >
                        <item.icon
                            size={24}
                            weight={window.location.pathname === item.path ? "fill" : "regular"}
                        />
                        <span className="text-[10px] font-medium">{item.label}</span>
                    </NavLink>
                ))}

                <button className="absolute -top-6 left-1/2 -translate-x-1/2 w-14 h-14 rounded-full bg-gradient-to-tr from-primary to-success flex items-center justify-center text-app shadow-xl shadow-primary/30 active:scale-95 transition-transform border-4 border-app">
                    <Plus size={24} weight="bold" />
                </button>
            </div>
        </div>
    );
};