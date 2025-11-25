import React from 'react';

export const Footer: React.FC = () => {
    return (
        <footer className="border-t border-[#1d2440] bg-[#0b1020] py-6 mt-auto hide-footer:hidden">
            <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-[#9ba2c0]">
                <div>
                    <span className="font-semibold text-[#f5f7ff]">TERRA</span> &copy; {new Date().getFullYear()} Eco-Science Platform
                </div>
                <div className="flex items-center gap-6">
                    <a href="#" className="hover:text-[#56ccf2] transition">Documentation</a>
                    <a href="#" className="hover:text-[#56ccf2] transition">Support</a>
                    <a href="#" className="hover:text-[#56ccf2] transition">Privacy Policy</a>
                </div>
            </div>
        </footer>
    );
};
