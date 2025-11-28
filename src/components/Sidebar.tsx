import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  SquaresFour,
  TreeStructure,
  MapTrifold,
  Gear,
  Leaf,
  CaretLeft,
  CaretRight,
  SignOut
} from 'phosphor-react';
import clsx from 'clsx';

interface SidebarProps {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  mobile?: boolean; // New prop to style differently for mobile drawer
}

export const Sidebar: React.FC<SidebarProps> = ({
  collapsed = false,
  onToggleCollapse,
  mobile = false
}) => {
  const navItems = [
    { icon: SquaresFour, label: 'Dashboard', path: '/' },
    { icon: TreeStructure, label: 'Projects', path: '/projects' },
    { icon: Leaf, label: 'Vegetation', path: '/projects/vegetation' }, // Example deep link
    { icon: MapTrifold, label: 'Map View', path: '/map' },
  ];

  const bottomItems = [
    { icon: Gear, label: 'Settings', path: '/settings' },
  ];

  const NavItem = ({ item }: { item: typeof navItems[0] }) => (
    <NavLink
      to={item.path}
      end={item.path === '/'} // Exact match for home
      className={({ isActive }) =>
        clsx(
          'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative',
          'text-sm font-medium',
          isActive
            ? 'bg-primary/10 text-primary shadow-[0_0_20px_rgba(86,204,242,0.15)] border border-primary/20'
            : 'text-text-muted hover:bg-panel-soft hover:text-text-main border border-transparent',
          collapsed && !mobile && 'justify-center px-2'
        )
      }
    >
      <item.icon
        size={20}
        weight={item.path === window.location.pathname ? 'fill' : 'regular'}
        className={clsx("transition-transform group-hover:scale-110", collapsed && !mobile && "mx-auto")}
      />

      {(!collapsed || mobile) && (
        <span className="whitespace-nowrap animate-in fade-in duration-300">
          {item.label}
        </span>
      )}

      {/* Desktop Collapsed Tooltip */}
      {collapsed && !mobile && (
        <div className="absolute left-full ml-4 px-2 py-1 bg-panel border border-border rounded text-xs text-text-main opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 shadow-xl translate-x-[-10px] group-hover:translate-x-0 transition-all">
          {item.label}
        </div>
      )}
    </NavLink>
  );

  return (
    <aside className={clsx(
      "h-full flex flex-col transition-all duration-300 relative overflow-hidden",
      // Glass Effect
      "bg-app/80 backdrop-blur-xl border-r border-border",
      mobile ? "w-full" : (collapsed ? "w-20" : "w-64")
    )}>

      {/* Brand Section */}
      <div className={clsx(
        "h-16 flex items-center flex-shrink-0 border-b border-border mx-4 mb-2",
        collapsed && !mobile ? "justify-center mx-0" : "justify-between"
      )}>
        <div className={clsx("flex items-center gap-2 overflow-hidden", collapsed && !mobile && "hidden")}>
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-success flex items-center justify-center shadow-lg shadow-primary/20">
            <Leaf weight="fill" className="text-white" size={18} />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-bold text-lg tracking-tight text-text-main leading-none">TERRA</span>
              <span className="text-[9px] uppercase tracking-[0.2em] text-text-muted font-medium">Platform</span>
            </div>
          )}
        </div>

        {/* Collapse Toggle (Desktop Only) */}
        {!mobile && onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className={clsx(
              "p-1.5 rounded-md text-text-muted hover:text-text-main hover:bg-panel-soft transition-colors",
              collapsed && "mx-auto"
            )}
          >
            {collapsed ? <CaretRight size={16} /> : <CaretLeft size={16} />}
          </button>
        )}
      </div>

      {/* Navigation Areas */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-4 space-y-6 scrollbar-none">

        {/* Main Nav */}
        <nav className="space-y-1">
          {(!collapsed || mobile) && (
            <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-text-muted animate-in fade-in">
              General
            </div>
          )}
          {navItems.map((item) => <NavItem key={item.path} item={item} />)}
        </nav>

        {/* Workspace / Projects Section (Example of grouped items) */}
        <nav className="space-y-1">
          {(!collapsed || mobile) && (
            <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-text-muted animate-in fade-in flex justify-between items-center">
              <span>Recent Surveys</span>
            </div>
          )}
          {/* Hardcoded example of recent items */}
          <NavLink to="/projects/p-101" className={clsx(
            "flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-text-muted hover:text-text-main hover:bg-panel-soft transition-colors border border-transparent",
            collapsed && !mobile && "justify-center"
          )}>
            <span className="w-2 h-2 rounded-full bg-success shadow-[0_0_8px_rgba(82,210,115,0.5)]" />
            {(!collapsed || mobile) && <span className="truncate">Western Ghats Q1</span>}
          </NavLink>
          <NavLink to="/projects/p-102" className={clsx(
            "flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-text-muted hover:text-text-main hover:bg-panel-soft transition-colors border border-transparent",
            collapsed && !mobile && "justify-center"
          )}>
            <span className="w-2 h-2 rounded-full bg-warning" />
            {(!collapsed || mobile) && <span className="truncate">Urban Forest A</span>}
          </NavLink>
        </nav>
      </div>

      {/* Bottom Actions / Profile */}
      <div className="p-3 border-t border-border space-y-1 bg-panel-soft/50">
        {bottomItems.map((item) => <NavItem key={item.path} item={item} />)}

        <button className={clsx(
          "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-danger hover:bg-danger/10 transition-colors mt-2",
          collapsed && !mobile && "justify-center px-2"
        )}>
          <SignOut size={20} weight="regular" />
          {(!collapsed || mobile) && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
};