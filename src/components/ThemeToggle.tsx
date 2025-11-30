import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { clsx } from 'clsx';

export const ThemeToggle: React.FC = () => {
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            className={clsx(
                "relative p-2 rounded-xl transition-all duration-300 overflow-hidden group",
                "hover:bg-panel-soft border border-transparent hover:border-border text-text-muted hover:text-text-main"
            )}
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
            <div className="relative w-5 h-5">
                <Sun
                    size={20}
                    className={clsx(
                        "absolute inset-0 transition-all duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)]",
                        theme === 'dark'
                            ? "rotate-90 opacity-0 scale-50"
                            : "rotate-0 opacity-100 scale-100 text-warning"
                    )}
                />
                <Moon
                    size={20}
                    className={clsx(
                        "absolute inset-0 transition-all duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)]",
                        theme === 'light'
                            ? "-rotate-90 opacity-0 scale-50"
                            : "rotate-0 opacity-100 scale-100 text-primary"
                    )}
                />
            </div>
        </button>
    );
};