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
  Database,
  ScanLine // New icon for the "Tech" feel
} from 'lucide-react';
import { clsx } from 'clsx';

interface SidebarProps {
  collapsed: boolean;
  mobile?: boolean;
  className?: string; // Added for flexibility
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, className }) => {

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
      // Base Physics: Glassmorphism via semantic tokens
      "h-full flex flex-col border-r border-border bg-app/80 backdrop-blur-2xl transition-all duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] relative overflow-hidden",
      // Width handled by parent, but we ensure content containment
      "w-full",
      className
    )}>

      {/* Ambient Noise Texture (Optional: Adds "Film Grain" depth) */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay"
        style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}
      />

      {/* 1. BRAND HEADER */}
      <div className={clsx(
        "h-20 flex items-center shrink-0 border-b border-border/50 transition-all duration-300 relative z-10",
        collapsed ? "justify-center px-0" : "justify-start px-6"
      )}>
        <div className="flex items-center gap-4 overflow-hidden group/brand cursor-pointer">
          {/* Logo Mark: Neumorphic extrusion */}
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-panel-soft to-panel border border-white/10 flex items-center justify-center shrink-0 shadow-lg group-hover/brand:shadow-primary/20 group-hover/brand:border-primary/30 transition-all duration-500">
            <ScanLine className="w-5 h-5 text-primary" strokeWidth={2} />
          </div>

          {/* Text Logo */}
          <div className={clsx(
            "flex flex-col transition-all duration-300 origin-left",
            collapsed ? "w-0 opacity-0 scale-90 translate-x-4" : "w-auto opacity-100 scale-100 translate-x-0"
          )}>
            <span className="font-black text-xl tracking-tight text-text-main leading-none font-display">
              TERRA<span className="text-primary">.OS</span>
            </span>
            <span className="text-[9px] uppercase tracking-[0.35em] text-text-muted font-bold mt-1 opacity-70">
              Ver 2.4.0
            </span>
          </div>
        </div>
      </div>

      {/* 2. SCROLLABLE NAV AREA */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden py-8 space-y-9 scrollbar-none relative z-10">

        {navGroups.map((group, groupIdx) => (
          <div key={groupIdx} className="px-3">
            {/* Section Title: Optical alignment */}
            {!collapsed && (
              <h4 className="px-4 mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-text-muted/40 animate-in fade-in slide-in-from-left-2">
                {group.title}
              </h4>
            )}

            {/* Separator for Collapsed Mode */}
            {collapsed && groupIdx > 0 && <div className="h-px w-6 mx-auto bg-border/50 mb-4" />}

            <div className="space-y-1">
              {group.items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/'}
                  className={({ isActive }) => clsx(
                    "relative flex items-center rounded-xl transition-all duration-300 group h-11",
                    collapsed ? "justify-center px-0 w-11 mx-auto" : "justify-start px-4",
                    isActive
                      ? "text-primary bg-primary/10 shadow-[0_0_20px_-5px_rgba(var(--primary),0.3)]" // Uses semantic var implicitly if Tailwind config maps it, else use raw class if config is set
                      : "text-text-muted hover:text-text-main hover:bg-white/5"
                  )}
                >
                  {({ isActive }) => (
                    <>
                      {/* Active "Laser" Indicator (Left Border) - Pure CSS Geometry */}
                      {isActive && (
                        <div className={clsx(
                          "absolute left-0 top-1/2 -translate-y-1/2 w-1 bg-primary rounded-r-full shadow-[0_0_12px_var(--primary)] transition-all duration-500",
                          collapsed ? "h-6 left-0.5" : "h-6 left-0"
                        )} />
                      )}

                      {/* Icon: Proper stroke width modulation */}
                      <item.icon
                        size={20}
                        strokeWidth={isActive ? 2.5 : 1.75} // Thicker when active for optical weight
                        className={clsx(
                          "transition-transform duration-300 z-10",
                          isActive && !collapsed && "translate-x-1",
                          !isActive && "group-hover:scale-110 opacity-80 group-hover:opacity-100"
                        )}
                      />

                      {/* Label (Hidden on Collapse) */}
                      {!collapsed && (
                        <span className={clsx(
                          "ml-3 text-sm font-medium whitespace-nowrap overflow-hidden text-ellipsis transition-all duration-300",
                          isActive ? "translate-x-1" : "translate-x-0"
                        )}>
                          {item.label}
                        </span>
                      )}

                      {/* Beta Tag: Cyberpunk style */}
                      {!collapsed && item.beta && (
                        <span className="ml-auto text-[9px] font-bold text-primary bg-primary/10 border border-primary/20 px-1.5 py-0.5 rounded shadow-[0_0_10px_rgba(var(--primary),0.1)]">
                          BETA
                        </span>
                      )}

                      {/* Hover Tooltip for Collapsed Mode */}
                      {collapsed && (
                        <div className="absolute left-full ml-4 px-3 py-1.5 bg-panel-soft border border-border rounded-lg text-xs font-bold text-text-main opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 z-50 shadow-xl whitespace-nowrap translate-x-2 group-hover:translate-x-0">
                          {item.label}
                          {/* Triangle Pointer */}
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
      <div className="p-4 border-t border-border/50 bg-black/20 relative z-10">
        <button className={clsx(
          "flex items-center rounded-xl transition-all duration-300 text-text-muted hover:text-danger hover:bg-danger/10 h-11 w-full group overflow-hidden border border-transparent hover:border-danger/20",
          collapsed ? "justify-center" : "justify-start px-4 gap-3"
        )}>
          <LogOut size={18} className="transition-transform group-hover:-translate-x-1" />
          {!collapsed && <span className="text-sm font-bold">Disconnect</span>}
        </button>
      </div>
    </aside>
  );
};