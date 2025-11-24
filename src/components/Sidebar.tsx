import React from 'react';
import { NavLink } from 'react-router-dom';
import { House, TreeStructure, Gear, MapTrifold } from 'phosphor-react';
import clsx from 'clsx';

export const Sidebar: React.FC = () => {
  const navItems = [
    { icon: House, label: 'Dashboard', path: '/' },
    { icon: TreeStructure, label: 'Projects', path: '/projects' },
    { icon: MapTrifold, label: 'Map', path: '/map' },
    { icon: Gear, label: 'Settings', path: '/settings' },
  ];

  return (
    <aside className="w-full h-full bg-panel border-r border-border flex flex-col">
      <div className="p-6 border-b border-border">
        <h1 className="text-xl font-bold tracking-wide text-primary">TERRA</h1>
        <p className="text-xs text-text-muted mt-1">Eco-Science Platform</p>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200',
                'text-sm font-medium',
                isActive
                  ? 'bg-primary-dim text-primary border border-primary/20'
                  : 'text-text-muted hover:bg-panel-soft hover:text-text-main'
              )
            }
          >
            <item.icon size={20} weight={item.path === '/' ? 'fill' : 'regular'} />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-panel-soft border border-border">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold">
            JD
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-text-main truncate">Jane Doe</p>
            <p className="text-xs text-text-muted truncate">Ecologist</p>
          </div>
        </div>
      </div>
    </aside>
  );
};
