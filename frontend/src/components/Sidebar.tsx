import React, { useState, useRef, useEffect } from 'react';
import {
  LayoutGrid,
  Kanban,
  FolderGit2,
  Sparkles,
  Plus,
  Users,
  ShieldCheck,
  UserCheck,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { useProjects } from '../context/ProjectContext';
import { useAuth } from '../context/AuthContext';
import { getRoleTheme } from '../theme/roleTheme';

interface SidebarProps {
  currentRoute: string;
  onNavigate: (route: string) => void;
  onOpenNewProject: () => void;
}

const INITIATIVE_DOT_STYLES: Record<string, { base: string; active: string }> = {
  PAY: {
    base: 'bg-emerald-400',
    active: 'bg-emerald-400 ring-4 ring-emerald-400/25 shadow-[0_0_8px_#10b981]',
  },
  MOB: {
    base: 'bg-amber-400',
    active: 'bg-amber-400 ring-4 ring-amber-400/25 shadow-[0_0_8px_#f59e0b]',
  },
  OPS: {
    base: 'bg-blue-400',
    active: 'bg-blue-400 ring-4 ring-blue-400/25 shadow-[0_0_8px_#3b82f6]',
  },
};

export const Sidebar: React.FC<SidebarProps> = ({
  currentRoute,
  onNavigate,
  onOpenNewProject,
}) => {
  const { projects, activeProject, setActiveProject } = useProjects();
  const { user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const initiativeRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const isAdmin = user?.role === 'admin';
  const canCreateProject = !!user;
  const roleTheme = getRoleTheme(user?.role);

  // Auto-scroll active tab and active initiative chip into view on load and on switch
  useEffect(() => {
    const activeTabEl = tabRefs.current[currentRoute];
    if (activeTabEl) {
      activeTabEl.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      });
    }
  }, [currentRoute]);

  useEffect(() => {
    if (activeProject?._id) {
      const activeInitEl = initiativeRefs.current[activeProject._id];
      if (activeInitEl) {
        activeInitEl.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center',
        });
      }
    }
  }, [activeProject?._id]);

  const navItems: Array<{
    id: string;
    label: string;
    icon: any;
    shortcut: string;
    badge?: string;
  }> = [
    { id: 'dashboard', label: 'Overview', icon: LayoutGrid, shortcut: 'G O' },
    { id: 'board', label: 'Active Sprint', icon: Kanban, shortcut: 'G S' },
    {
      id: 'projects',
      label: 'Initiatives',
      icon: FolderGit2,
      shortcut: 'G I',
      badge: `${projects.length}`,
    },
    { id: 'ai', label: 'Planning Assistant', icon: Sparkles, shortcut: 'G A' },
    { id: 'profile', label: 'Team Members', icon: Users, shortcut: 'G T' },
  ];

  if (isAdmin) {
    navItems.push(
      {
        id: 'admin-audit',
        label: 'Security & Logs',
        icon: ShieldCheck,
        shortcut: 'G L',
      },
      {
        id: 'impersonate',
        label: 'User Impersonation',
        icon: UserCheck,
        shortcut: 'G U',
      }
    );
  }

  const handleNavItemClick = (id: string) => {
    if (id === 'impersonate') {
      sessionStorage.setItem('pulsedev_profile_tab', 'directory');
      window.dispatchEvent(
        new CustomEvent('pulsedev:profile-tab', { detail: 'directory' })
      );
      onNavigate('profile');
      return;
    }
    onNavigate(id);
  };

  return (
    <>
      {/* Mobile Horizontal Navigation Bar (Always visible on mobile < md) */}
      <div className="flex md:hidden flex-col border-b border-white/[0.07] bg-[#0a0d14] select-none">
        {/* Row 1: Primary Navigation Tabs (Hidden scrollbar + Right-edge fade + >=44px touch targets) */}
        <div className="relative">
          <div className="flex items-center gap-1.5 overflow-x-auto px-3 pr-10 py-1.5 no-scrollbar scroll-fade-right">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentRoute === item.id;
              return (
                <button
                  key={item.id}
                  ref={(el) => {
                    tabRefs.current[item.id] = el;
                  }}
                  onClick={() => handleNavItemClick(item.id)}
                  className={`relative flex min-h-[44px] items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs whitespace-nowrap flex-shrink-0 transition-all cursor-pointer ${
                    isActive
                      ? 'bg-white/[0.09] text-white font-semibold border border-white/[0.2] shadow-sm'
                      : 'bg-white/[0.03] text-neutral-300 border border-white/[0.06] hover:text-white'
                  }`}
                >
                  <Icon
                    className="h-3.5 w-3.5"
                    style={{ color: isActive ? roleTheme.accentHex : undefined }}
                  />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="ml-0.5 rounded bg-white/[0.08] px-1.5 py-0.5 font-mono text-[10px] text-neutral-200">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-9 bg-gradient-to-l from-[#0a0d14] via-[#0a0d14]/70 to-transparent" />
        </div>

        {/* Row 2: Mobile Initiatives Quick Bar (Hidden scrollbar + Right-edge fade + >=44px touch targets) */}
        <div className="relative border-t border-white/[0.05] bg-[#080a10]">
          <div className="flex items-center gap-1.5 overflow-x-auto px-3 pr-10 py-1 no-scrollbar scroll-fade-right">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400 flex-shrink-0 mr-1">
              Initiatives:
            </span>
            {projects.map((p) => {
              const isSelected = activeProject?._id === p._id;
              const dotConfig = INITIATIVE_DOT_STYLES[p.key] || {
                base: 'bg-emerald-400',
                active: 'bg-emerald-400 ring-2 ring-emerald-400/30',
              };
              return (
                <button
                  key={p._id}
                  ref={(el) => {
                    initiativeRefs.current[p._id] = el;
                  }}
                  onClick={() => {
                    setActiveProject(p);
                    if (currentRoute !== 'board' && currentRoute !== 'dashboard') {
                      onNavigate('board');
                    }
                  }}
                  className={`flex min-h-[44px] items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs whitespace-nowrap flex-shrink-0 transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-white/[0.1] text-white font-semibold border border-white/[0.16]'
                      : 'text-neutral-300 hover:text-white border border-transparent'
                  }`}
                >
                  <span
                    className={`h-2 w-2 rounded-full flex-shrink-0 ${
                      isSelected ? dotConfig.active : dotConfig.base
                    }`}
                  />
                  <span className="font-mono text-[11px] text-neutral-200">{p.key}</span>
                  <span className="max-w-[130px] truncate">{p.title}</span>
                  <span className="font-mono text-[11px] text-emerald-400">{p.progress}%</span>
                </button>
              );
            })}
            {canCreateProject && (
              <button
                onClick={onOpenNewProject}
                className="flex min-h-[44px] min-w-[44px] h-11 w-11 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] text-emerald-400 flex-shrink-0 cursor-pointer"
                title="New initiative"
                aria-label="New initiative"
              >
                <Plus className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-9 bg-gradient-to-l from-[#080a10] via-[#080a10]/70 to-transparent" />
        </div>
      </div>

      {/* Desktop Left Sidebar (md and up) */}
      <aside
        aria-label="Workspace navigation"
        className={`hidden md:flex flex-col border-r border-white/[0.07] bg-[#0a0d14] select-none transition-all duration-200 ${
          collapsed ? 'w-16' : 'w-60'
        }`}
      >
      {/* Primary Navigation */}
      <div className="px-2.5 pt-4 pb-2">
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentRoute === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavItemClick(item.id)}
                title={collapsed ? `${item.label} (${item.shortcut})` : undefined}
                className={`group relative flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-[13px] transition-all duration-150 cursor-pointer ${
                  isActive
                    ? 'bg-white/[0.07] text-white font-medium'
                    : 'text-neutral-400 hover:bg-white/[0.035] hover:text-neutral-200'
                }`}
              >
                {/* Active Indicator Bar */}
                {isActive && (
                  <span
                    className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r"
                    style={{ backgroundImage: roleTheme.gradientCss }}
                  />
                )}

                <div className={`flex items-center gap-2.5 truncate ${collapsed ? 'mx-auto' : ''}`}>
                  <Icon
                    className={`h-4 w-4 flex-shrink-0 transition-colors ${
                      isActive ? '' : 'text-neutral-500 group-hover:text-neutral-300'
                    }`}
                    style={{ color: isActive ? roleTheme.accentHex : undefined }}
                  />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </div>

                {!collapsed && (
                  <div className="flex items-center gap-1.5">
                    {item.badge ? (
                      <span className="font-mono text-[11px] text-neutral-500">
                        {item.badge}
                      </span>
                    ) : (
                      <span className="opacity-0 group-hover:opacity-100 font-mono text-[10px] text-neutral-600 transition-opacity">
                        {item.shortcut}
                      </span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Initiatives List */}
      <div className="mt-3 flex-1 overflow-y-auto px-2.5 py-2 border-t border-white/[0.06]">
        {!collapsed && (
          <div className="flex items-center justify-between px-2.5 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
              Initiatives
            </span>
            {canCreateProject && (
              <button
                onClick={onOpenNewProject}
                className="flex h-5 w-5 items-center justify-center rounded text-neutral-400 hover:bg-white/[0.08] hover:text-white transition-colors cursor-pointer"
                title="New initiative"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        )}

        <div className="space-y-1">
          {projects.map((p) => {
            const isSelected = activeProject?._id === p._id;
            const dotConfig = INITIATIVE_DOT_STYLES[p.key] || {
              base: 'bg-emerald-400',
              active: 'bg-emerald-400 ring-4 ring-emerald-400/25',
            };

            return (
              <button
                key={p._id}
                onClick={() => {
                  setActiveProject(p);
                  if (currentRoute !== 'board' && currentRoute !== 'dashboard') {
                    onNavigate('board');
                  }
                }}
                title={collapsed ? `${p.title} (${p.progress}%)` : undefined}
                className={`group relative flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-white/[0.08] text-white font-semibold border border-white/[0.12] shadow-sm'
                    : 'text-neutral-300 hover:bg-white/[0.04] hover:text-white border border-transparent'
                }`}
              >
                <div className={`flex items-center gap-2.5 truncate ${collapsed ? 'mx-auto' : ''}`}>
                  <span
                    className={`h-2 w-2 rounded-full flex-shrink-0 transition-all ${
                      isSelected ? dotConfig.active : dotConfig.base
                    }`}
                  />
                  {!collapsed && <span className="truncate">{p.title}</span>}
                </div>
                {!collapsed && (
                  <span
                    className={`font-mono text-[11px] ml-2 ${
                      isSelected ? 'text-white font-semibold' : 'text-neutral-400'
                    }`}
                  >
                    {p.progress}%
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer Collapse Toggle (WCAG AA High Contrast) */}
      <div className="border-t border-white/[0.08] p-2.5 flex items-center justify-between">
        {!collapsed && (
          <div className="flex items-center gap-2 px-1">
            <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_6px_#10b981]" />
            <span className="text-xs font-medium text-neutral-200 truncate">
              Cycle 44 · Active
            </span>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`flex h-7 w-7 items-center justify-center rounded-lg text-neutral-400 hover:bg-white/[0.06] hover:text-white transition-colors cursor-pointer ${
            collapsed ? 'mx-auto' : ''
          }`}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <PanelLeftOpen className="h-4 w-4" />
          ) : (
            <PanelLeftClose className="h-4 w-4" />
          )}
        </button>
      </div>
    </aside>
    </>
  );
};

export default Sidebar;
