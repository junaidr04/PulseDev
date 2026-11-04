import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import {
  FolderGit2,
  Kanban,
  LayoutGrid,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  ShieldCheck,
  Sparkles,
  Users,
  X,
} from 'lucide-react';
import { useProjects } from '../context/ProjectContext';
import { useAuth } from '../context/AuthContext';
import { getRoleTheme } from '../theme/roleTheme';

interface SidebarProps {
  currentRoute: string;
  onNavigate: (route: string) => void;
  onOpenNewProject: () => void;
  isMobileOpen: boolean;
  onMobileClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentRoute,
  onNavigate,
  onOpenNewProject,
  isMobileOpen,
  onMobileClose,
}) => {
  const { projects, activeProject, setActiveProject } = useProjects();
  const { user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const roleTheme = getRoleTheme(user?.role);
  const reduceMotion = useReducedMotion();

  const navItems = [
    { id: 'dashboard', label: 'Overview', icon: LayoutGrid, shortcut: 'G O' },
    { id: 'board', label: 'Active Sprint', icon: Kanban, shortcut: 'G S' },
    { id: 'projects', label: 'Initiatives', icon: FolderGit2, shortcut: 'G I', badge: `${projects.length}` },
    { id: 'ai', label: 'Planning Assistant', icon: Sparkles, shortcut: 'G A' },
    { id: 'profile', label: 'Team Members', icon: Users, shortcut: 'G T' },
    ...(user?.role === 'admin'
      ? [{ id: 'admin-audit', label: 'Security & Logs', icon: ShieldCheck, shortcut: 'G L' }]
      : []),
  ];

  useEffect(() => {
    if (!isMobileOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onMobileClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileOpen, onMobileClose]);

  const navigate = (route: string) => {
    onNavigate(route);
    onMobileClose();
  };

  const selectProject = (project: (typeof projects)[number]) => {
    setActiveProject(project);
    if (currentRoute !== 'board' && currentRoute !== 'dashboard') {
      onNavigate('board');
    }
    onMobileClose();
  };

  return (
    <>
      <AnimatePresence>
        {isMobileOpen && (
        <motion.div
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.18, ease: 'easeOut' }}
          className="fixed inset-0 z-50 md:hidden"
        >
          <button
            type="button"
            aria-label="Close navigation"
            className="absolute inset-0 bg-black/60"
            onClick={onMobileClose}
          />
          <motion.aside
            initial={reduceMotion ? false : { x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ duration: reduceMotion ? 0 : 0.2, ease: 'easeOut' }}
            role="dialog"
            aria-modal="true"
            aria-label="Workspace navigation"
            className="absolute inset-y-0 left-0 flex w-[min(85vw,18rem)] flex-col border-r border-white/[0.08] bg-[#0a0d14] shadow-xl"
          >
            <div className="flex min-h-14 items-center justify-between border-b border-white/[0.07] px-4 py-2">
              <span className="text-sm font-semibold text-white">Workspace</span>
              <button
                type="button"
                onClick={onMobileClose}
                aria-label="Close navigation"
                className="flex min-h-10 min-w-10 items-center justify-center rounded-lg text-neutral-300 hover:bg-white/[0.06] hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <nav className="space-y-1 px-2.5 py-3">
              {navItems.map(({ id, label, icon: Icon, badge }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => navigate(id)}
                  className={`flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-left text-sm ${
                    currentRoute === id
                      ? 'bg-white/[0.08] text-white'
                      : 'text-neutral-300 hover:bg-white/[0.04]'
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="min-w-0 flex-1 truncate">{label}</span>
                  {badge && <span className="text-xs text-neutral-500">{badge}</span>}
                </button>
              ))}
            </nav>
            <div className="min-h-0 flex-1 overflow-y-auto border-t border-white/[0.07] px-2.5 py-3">
              <div className="mb-2 flex items-center justify-between px-2 text-xs font-medium text-neutral-400">
                <span>Projects</span>
                <button
                  type="button"
                  onClick={() => {
                    onOpenNewProject();
                    onMobileClose();
                  }}
                  className="flex min-h-10 min-w-10 items-center justify-center rounded-md hover:bg-white/[0.06]"
                  aria-label="New project"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-1">
                {projects.map((project) => (
                  <button
                    key={project._id}
                    type="button"
                    onClick={() => selectProject(project)}
                    className={`flex min-h-11 w-full items-center gap-2 rounded-lg px-3 text-left text-sm ${
                      activeProject?._id === project._id
                        ? 'bg-white/[0.08] text-white'
                        : 'text-neutral-300 hover:bg-white/[0.04]'
                    }`}
                  >
                    <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-400" />
                    <span className="min-w-0 flex-1 truncate">{project.title}</span>
                    <span className="shrink-0 text-xs text-neutral-500">
                      {project.progress}%
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </motion.aside>
        </motion.div>
        )}
      </AnimatePresence>

      <aside
        aria-label="Workspace navigation"
        className={`hidden md:flex flex-col border-r border-white/[0.07] bg-[#0a0d14] select-none transition-all duration-200 ${
          collapsed ? 'w-16' : 'w-60'
        }`}
      >
        <div className="px-2.5 pt-4 pb-2">
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentRoute === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => navigate(item.id)}
                  title={collapsed ? `${item.label} (${item.shortcut})` : undefined}
                  className={`group relative flex min-h-10 w-full items-center justify-between rounded-lg px-2.5 py-2 text-[13px] transition-colors ${
                    isActive
                      ? 'bg-white/[0.07] text-white font-medium'
                      : 'text-neutral-400 hover:bg-white/[0.035] hover:text-neutral-200'
                  }`}
                >
                  {isActive && (
                    <span
                      className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r"
                      style={{ backgroundColor: roleTheme.accentHex }}
                    />
                  )}
                  <div className={`flex min-w-0 items-center gap-2.5 ${collapsed ? 'mx-auto' : ''}`}>
                    <Icon
                      className="h-4 w-4 shrink-0"
                      style={{ color: isActive ? roleTheme.accentHex : undefined }}
                    />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </div>
                  {!collapsed && item.badge && (
                    <span className="text-xs text-neutral-500">{item.badge}</span>
                  )}
                  {!collapsed && !item.badge && (
                    <span className="font-mono text-[10px] text-neutral-600 opacity-0 transition-opacity group-hover:opacity-100">
                      {item.shortcut}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="mt-3 flex-1 overflow-y-auto border-t border-white/[0.06] px-2.5 py-2">
          {!collapsed && (
            <div className="mb-2 flex items-center justify-between px-2.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                Initiatives
              </span>
              {user && (
                <button
                  type="button"
                  onClick={onOpenNewProject}
                  className="flex min-h-10 min-w-10 items-center justify-center rounded text-neutral-400 hover:bg-white/[0.08] hover:text-white"
                  title="New initiative"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          )}
          <div className="space-y-1">
            {projects.map((project) => (
              <button
                key={project._id}
                type="button"
                onClick={() => selectProject(project)}
                title={collapsed ? project.title : undefined}
                className={`flex min-h-10 w-full items-center justify-between rounded-lg border px-2.5 py-2 text-left text-xs transition-colors ${
                  activeProject?._id === project._id
                    ? 'border-white/[0.12] bg-white/[0.08] font-semibold text-white'
                    : 'border-transparent text-neutral-300 hover:bg-white/[0.04] hover:text-white'
                }`}
              >
                <span className={`flex min-w-0 items-center gap-2.5 ${collapsed ? 'mx-auto' : ''}`}>
                  <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-400" />
                  {!collapsed && <span className="truncate">{project.title}</span>}
                </span>
                {!collapsed && (
                  <span className="ml-2 shrink-0 text-[11px] text-neutral-400">
                    {project.progress}%
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-white/[0.08] p-2.5">
          <button
            type="button"
            onClick={() => setCollapsed((value) => !value)}
            className={`flex h-10 w-10 items-center justify-center rounded-lg text-neutral-400 hover:bg-white/[0.06] hover:text-white ${
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
