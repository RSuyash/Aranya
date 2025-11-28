import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderOpen,
  Map as MapIcon,
  Settings,
  Leaf,
  Bird,
  Droplets,
  LogOut,
  Database
} from 'lucide-react';
import { clsx } from 'clsx';

interface SidebarProps {
  collapsed: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed }) => {

  // --- NAVIGATION CONFIG ---
  const navGroups = [
    {
      title: 'Mission',
      items: [
        { icon: LayoutDashboard, label: 'Mission Control', path: '/' },
        { icon: FolderOpen, label: 'Projects', path: '/projects' },
        { icon: MapIcon, label: 'Global Map', path: '/map' },
      ]
    },
    {
      title: 'Modules',
      items: [
        { icon: Leaf, label: 'Vegetation', path: '/projects/vegetation' },
        { icon: Bird, label: 'Avian Surveys', path: '/projects/birds', beta: true },
        { icon: Droplets, label: 'Water Quality', path: '/projects/water', beta: true },
      ]
    },
    {
      title: 'System',
      items: [
        { icon: Database, label: 'Data Manager', path: '/analysis' },
        { icon: Settings, label: 'Settings', path: '/settings' },
      ]
    }
  ];

  return (
    <aside className={clsx(
      "h-full flex flex-col border-r border-white/5 bg-app/95 backdrop-blur-2xl transition-all duration-300 relative overflow-hidden",
      // Width is controlled by the parent container in MainLayout
      "w-full"
    )}>

      {/* 1. BRAND HEADER */}
      <div className={clsx(
        "h-16 flex items-center shrink-0 border-b border-white/5 transition-all duration-300",
        collapsed ? "justify-center px-0" : "justify-start px-6"
      )}>
        <div className="flex items-center gap-3 overflow-hidden">
          {/* Logo Mark */}
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-emerald-500 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
            <Leaf className="w-4 h-4 text-app" strokeWidth={3} />
          </div>

          {/* Text Logo (Hidden on Collapse) */}
          <div className={clsx(
            "flex flex-col transition-all duration-300 origin-left",
            collapsed ? "w-0 opacity-0 scale-90" : "w-auto opacity-100 scale-100"
          )}>
            <span className="font-black text-lg tracking-tight text-text-main leading-none">TERRA</span>
            <span className="text-[9px] uppercase tracking-[0.3em] text-primary font-bold">OS v2.4</span>
          </div>
        </div>
      </div>

      {/* 2. SCROLLABLE NAV AREA */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden py-6 space-y-8 scrollbar-none">

        {navGroups.map((group, groupIdx) => (
          <div key={groupIdx} className="px-3">
            {/* Section Title */}
            {!collapsed && (
              <h4 className="px-3 mb-2 text-[10px] font-bold uppercase tracking-widest text-text-muted/50 animate-in fade-in slide-in-from-left-2">
                {group.title}
              </h4>
            )}
            {/* Separator for Collapsed Mode */}
            {collapsed && groupIdx > 0 && <div className="h-px w-8 mx-auto bg-white/5 mb-3" />}

            <div className="space-y-1">
              {group.items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/'}
                  className={({ isActive }) => clsx(
                    "relative flex items-center rounded-lg transition-all duration-200 group h-10",
                    collapsed ? "justify-center px-0" : "justify-start px-3",
                    isActive
                      ? "text-primary bg-primary/10"
                      : "text-text-muted hover:text-text-main hover:bg-white/5"
                  )}
                >
                  {({ isActive }) => (
                    <>
                      {/* Active "Laser" Indicator (Left Border) */}
                      {isActive && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full shadow-[0_0_12px_var(--primary)] animate-in fade-in zoom-in duration-300" />
                      )}

                      {/* Icon */}
                      <item.icon
                        size={20}
                        strokeWidth={isActive ? 2.5 : 2}
                        className={clsx(
                          "transition-transform duration-300 z-10",
                          isActive && !collapsed && "translate-x-1 text-primary",
                          !isActive && "group-hover:scale-110"
                        )}
                      />

                      {/* Label (Hidden on Collapse) */}
                      {!collapsed && (
                        <span className="ml-3 text-sm font-medium whitespace-nowrap overflow-hidden text-ellipsis transition-colors duration-300">
                          {item.label}
                        </span>
                      )}

                      {/* Beta Tag */}
                      {!collapsed && item.beta && (
                        <span className="ml-auto text-[9px] font-bold text-primary border border-primary/30 px-1.5 py-0.5 rounded">
                          BETA
                        </span>
                      )}

                      {/* Hover Tooltip for Collapsed Mode (Portal-like behavior via CSS) */}
                      {collapsed && (
                        <div className="absolute left-full ml-4 px-3 py-1.5 bg-panel border border-border rounded-md text-xs font-medium text-text-main opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-xl whitespace-nowrap">
                          {item.label}
                          {/* Arrow */}
                          <div className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 border-4 border-transparent border-r-border" />
                        </div>
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* 3. FOOTER (User/Logout) */}
      <div className="p-3 border-t border-white/5 bg-black/20">
        <button className={clsx(
          "flex items-center rounded-lg transition-colors text-danger/70 hover:text-danger hover:bg-danger/10 h-10 w-full group",
          collapsed ? "justify-center" : "justify-start px-3 gap-3"
        )}>
          <LogOut size={18} className="transition-transform group-hover:-translate-x-1" />
          {!collapsed && <span className="text-sm font-bold">Disconnect</span>}
        </button>
      </div>
    </aside>
  );
};