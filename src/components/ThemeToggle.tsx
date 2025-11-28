import React from 'react';
import { Sun, Moon } from 'phosphor-react';
import { useTheme } from '../context/ThemeContext';
import { clsx } from 'clsx';

export const ThemeToggle: React.FC = () => {
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            className={clsx(
                "p-2 rounded-lg transition-all duration-300 relative overflow-hidden group",
                "hover:bg-panel-soft border border-transparent hover:border-border text-text-muted hover:text-text-main"
            )}
            title="Toggle Theme"
        >
            <div className="relative w-5 h-5">
                <Sun
                    size={20}
                    weight="bold"
                    className={clsx(
                        "absolute inset-0 transition-all duration-500 transform origin-center",
                        theme === 'dark' ? "rotate-90 opacity-0 scale-0" : "rotate-0 opacity-100 scale-100"
                    )}
                />
                <Moon
                    size={20}
                    weight="bold"
                    className={clsx(
                        "absolute inset-0 transition-all duration-500 transform origin-center",
                        theme === 'light' ? "-rotate-90 opacity-0 scale-0" : "rotate-0 opacity-100 scale-100"
                    )}
                />
            </div>
        </button>
    );
};
