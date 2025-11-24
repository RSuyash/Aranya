import React from 'react';
import { List, Bell } from 'phosphor-react';

interface HeaderProps {
    title?: string;
}

export const Header: React.FC<HeaderProps> = ({ title = 'Dashboard' }) => {
    return (
        <header className="h-16 bg-bg-app/80 backdrop-blur-md border-b border-border sticky top-0 z-10 flex items-center justify-between px-6 ml-64">
            <div className="flex items-center gap-4">
                <button className="lg:hidden p-2 text-text-muted hover:text-text-main">
                    <List size={24} />
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
