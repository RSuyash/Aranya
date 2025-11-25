import React from 'react';
import { NavLink } from 'react-router-dom';
import { NAV_ITEMS } from '../config';
import { SignOut, Leaf } from 'phosphor-react';
import clsx from 'clsx';

interface SidebarProps {
    className?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ className }) => {
    const mainItems = NAV_ITEMS.filter(i => i.section === 'main');
    const moduleItems = NAV_ITEMS.filter(i => i.section === 'modules');
    const systemItems = NAV_ITEMS.filter(i => i.section === 'system' || i.section === 'analytics');

    const NavGroup = ({ title, items }: { title?: string, items: typeof NAV_ITEMS }) => (
        <div className="mb-6">
            {title && (
                <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-widest text-[#555b75] animate-in fade-in">
                    {title}
                </div>
            )}
            <div className="space-y-0.5">
                {items.map(item => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) => clsx(
                            "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 group relative",
                            isActive
                                ? "bg-[#56ccf2]/10 text-[#56ccf2]"
                                : "text-[#9ba2c0] hover:bg-white/5 hover:text-[#f5f7ff]"
                        )}
                    >
                        <item.icon size={18} weight="duotone" className="group-hover:scale-110 transition-transform" />
                        <span>{item.label}</span>

                        {item.beta && (
                            <span className="ml-auto text-[9px] bg-[#56ccf2]/10 text-[#56ccf2] px-1.5 py-0.5 rounded border border-[#56ccf2]/20">
                                BETA
                            </span>
                        )}

                        <NavLink to={item.path} className={({isActive}) => clsx(
                            "absolute left-0 top-1/2 -translate-y-1/2 w-1 h-0 bg-[#56ccf2] rounded-r-full transition-all duration-300",
                            isActive ? "h-5 opacity-100" : "h-0 opacity-0"
                        )} />
                    </NavLink>
                ))}
            </div>
        </div>
    );

    return (
        <aside className={clsx(
            "flex flex-col h-full bg-[#050814]/80 backdrop-blur-2xl border-r border-white/5 pt-6 pb-4 px-3",
            className
        )}>
            {/* Brand */}
            <div className="px-3 mb-8 flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#56ccf2] to-[#52d273] flex items-center justify-center shadow-lg shadow-[#56ccf2]/20">
                    <Leaf weight="fill" className="text-[#050814]" size={18} />
                </div>
                <div>
                    <h1 className="font-bold text-[#f5f7ff] tracking-tight leading-none">TERRA</h1>
                    <p className="text-[9px] text-[#9ba2c0] font-medium tracking-wider uppercase mt-0.5">Eco-Science Platform</p>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto scrollbar-none">
                <NavGroup items={mainItems} />
                <NavGroup title="Scientific Modules" items={moduleItems} />
                <NavGroup title="System" items={systemItems} />
            </div>

            <div className="pt-4 mt-2 border-t border-white/5">
                <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-[#ff7e67] hover:bg-[#ff7e67]/10 transition-colors">
                    <SignOut size={18} />
                    <span>Sign Out</span>
                </button>
            </div>
        </aside>
    );
};