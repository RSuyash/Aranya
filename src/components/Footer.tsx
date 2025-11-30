import React from 'react';

export const Footer: React.FC = () => {
    const year = new Date().getFullYear();

    return (
        <footer className="border-t border-border bg-panel/50 backdrop-blur-sm py-8 mt-auto hide-footer:hidden transition-colors duration-300">
            <div className="max-w-[1600px] mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-text-muted font-medium">
                <div className="flex items-center gap-2">
                    <span className="font-bold text-text-main tracking-tight">TERRA<span className="text-primary">.OS</span></span>
                    <span className="opacity-30">|</span>
                    <span>&copy; {year} Scientific Systems</span>
                </div>

                <div className="flex items-center gap-6">
                    <a href="#" className="hover:text-primary transition-colors">Documentation</a>
                    <a href="#" className="hover:text-primary transition-colors">System Status</a>
                    <a href="#" className="hover:text-primary transition-colors">Privacy Protocol</a>
                </div>
            </div>
        </footer>
    );
};