import React from 'react';
import { NavLink } from 'react-router-dom';
import { House, TreeStructure, Gear, MapTrifold } from 'phosphor-react';
import clsx from 'clsx';

interface SidebarProps {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed = false }) => {
  const navItems = [
    { icon: House, label: 'Dashboard', path: '/' },
    { icon: TreeStructure, label: 'Projects', path: '/projects' },
    { icon: MapTrifold, label: 'Map', path: '/map' },
    { icon: Gear, label: 'Settings', path: '/settings' },
  ];

  return (
    <aside className={clsx(
      "h-full bg-panel border-r border-border flex flex-col transition-all duration-300 w-full"
    )}>
      {/* Logo Section */}
      <div className={clsx(
        "h-16 flex items-center border-b border-border transition-all duration-300 bg-bg-app/50 backdrop-blur-sm",
        collapsed ? "justify-center px-0" : "px-6"
      )}>
        {collapsed ? (
          <span className="text-xl font-bold bg-gradient-to-r from-primary to-success bg-clip-text text-transparent">T</span>
        ) : (
          <div>
            <h1 className="text-xl font-bold tracking-wide bg-gradient-to-r from-primary to-success bg-clip-text text-transparent">TERRA</h1>
            <p className="text-[10px] uppercase tracking-wider text-text-muted mt-0.5">Eco-Science Platform</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-2 overflow-y-auto overflow-x-hidden">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 group relative',
                'text-sm font-medium',
                isActive
                  ? 'bg-primary-dim text-primary border border-primary/20'
                  : 'text-text-muted hover:bg-panel-soft hover:text-text-main',
                collapsed && 'justify-center'
              )
            }
          >
            <item.icon size={22} weight={item.path === '/' ? 'fill' : 'regular'} />

            {!collapsed && <span>{item.label}</span>}

            {/* Tooltip for collapsed state */}
            {collapsed && (
              <div className="absolute left-full ml-2 px-2 py-1 bg-panel border border-border rounded text-xs text-text-main opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 shadow-xl">
                {item.label}
              </div>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User Profile */}
      <div className="p-3 border-t border-border space-y-2 mt-auto">
        <div className={clsx(
          "flex items-center gap-3 p-2 rounded-lg bg-panel-soft border border-border transition-all",
          collapsed ? "justify-center" : "px-3"
        )}>
          <div className="w-8 h-8 min-w-[2rem] rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold">
            JD
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0 overflow-hidden">
              <p className="text-sm font-medium text-text-main truncate">Jane Doe</p>
              <p className="text-xs text-text-muted truncate">Ecologist</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
