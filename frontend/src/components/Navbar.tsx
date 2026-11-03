import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useProjects } from '../context/ProjectContext';
import NotificationPopover from './NotificationPopover';
import Avatar from './ui/Avatar';
import { getRoleTheme } from '../theme/roleTheme';
import {
  ChevronDown,
  LogOut,
  Search,
  Settings,
  User as UserIcon,
  FolderGit2,
  CheckCircle2,
  X,
  Command,
  KeyRound,
} from 'lucide-react';

interface NavbarProps {
  onNavigate: (route: string) => void;
  activeRoute: string;
}

export const PulseBrandLogo: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ size = 'md' }) => {
  return (
    <span className={`font-semibold tracking-tight text-white ${size === 'lg' ? 'text-2xl' : size === 'sm' ? 'text-sm' : 'text-base'}`}>
      PulseDev
    </span>
  );
};

export const Navbar: React.FC<NavbarProps> = ({
  onNavigate,
  activeRoute,
}) => {
  const { user, logout, isAuthenticated } = useAuth();
  const { projects, tasks, activeProject, setActiveProject } = useProjects();
  const roleTheme = getRoleTheme(user?.role);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const [searchOpen, setSearchOpen] = useState(false);
  const [globalQuery, setGlobalQuery] = useState('');
  const searchRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Global ⌘K / Ctrl+K shortcut for Command Palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen(true);
        searchInputRef.current?.focus();
      } else if (e.key === 'Escape') {
        setSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const matchedTasks = globalQuery.trim()
    ? (tasks || []).filter(
        (t) =>
          (t?.title || '').toLowerCase().includes(globalQuery.toLowerCase()) ||
          (t?.description || '').toLowerCase().includes(globalQuery.toLowerCase())
      )
    : (tasks || []).slice(0, 3);

  const matchedProjects = globalQuery.trim()
    ? (projects || []).filter(
        (p) =>
          (p?.title || '').toLowerCase().includes(globalQuery.toLowerCase()) ||
          (p?.key || '').toLowerCase().includes(globalQuery.toLowerCase())
      )
    : (projects || []).slice(0, 3);

  return (
    <>
      <header className="sticky top-0 z-30 flex h-15 w-full items-center justify-between border-b border-white/[0.07] bg-[#090b10] px-3 sm:px-4">
        {/* Left: Unique PulseDev Brand + Context Breadcrumb */}
        <div className="flex items-center gap-3">
          <div
            onClick={() => onNavigate('dashboard')}
            className="cursor-pointer min-h-[44px] flex items-center"
          >
            <PulseBrandLogo size="md" />
          </div>

          {isAuthenticated && activeProject && (
            <div className="hidden md:flex items-center gap-2 text-xs text-neutral-500 pl-2 border-l border-white/[0.08]">
              <button
                onClick={() => onNavigate('projects')}
                className="hover:text-neutral-300 transition-colors cursor-pointer py-1"
              >
                Projects
              </button>
              <span className="text-neutral-700">/</span>
              <button
                onClick={() => onNavigate('board')}
                className="flex items-center gap-1.5 font-medium text-neutral-200 hover:text-white transition-colors cursor-pointer py-1"
              >
                <span>{activeProject.title}</span>
              </button>
            </div>
          )}
        </div>

        {/* Center / Right: Command Palette Search (Desktop input + Mobile <640px icon button), Notifications & User Menu */}
        <div className="flex items-center gap-2">
          {isAuthenticated && (
            <div className="relative" ref={searchRef}>
              {/* Mobile (<640px) Search Icon Button (44x44px minimum touch target) */}
              <button
                type="button"
                onClick={() => {
                  setSearchOpen((prev) => !prev);
                  setTimeout(() => searchInputRef.current?.focus(), 40);
                }}
                aria-label="Open Command Palette Search"
                title="Search (⌘K)"
                className="flex sm:hidden min-h-[44px] min-w-[44px] h-11 w-11 items-center justify-center rounded-xl border border-white/[0.08] bg-[#131519] text-neutral-300 hover:border-white/[0.16] hover:text-white transition-colors cursor-pointer"
              >
                <Search className="h-4 w-4" />
              </button>

              {/* Desktop (>=640px) Search Input */}
              <div className="relative hidden sm:flex items-center">
                <Search className="absolute left-3 h-3.5 w-3.5 text-neutral-500 pointer-events-none" />
                <input
                  type="text"
                  value={globalQuery}
                  onFocus={() => setSearchOpen(true)}
                  onChange={(e) => {
                    setGlobalQuery(e.target.value);
                    setSearchOpen(true);
                  }}
                  placeholder="Search issues and projects"
                  aria-label="Command palette search"
                  className="h-9 w-64 lg:w-80 rounded-lg border border-white/[0.08] bg-[#11151f] pl-8 pr-12 text-xs text-neutral-200 placeholder-neutral-500 focus:border-emerald-500/40 focus:bg-[#141926] focus:outline-none transition-all"
                />
                {globalQuery ? (
                  <button
                    onClick={() => setGlobalQuery('')}
                    className="absolute right-2.5 text-neutral-500 hover:text-neutral-300 cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                ) : (
                  <kbd className="pointer-events-none absolute right-2 hidden sm:inline-flex items-center gap-0.5 rounded border border-white/[0.08] bg-white/[0.03] px-1.5 py-0.5 font-mono text-[10px] text-neutral-500">
                    ⌘K
                  </kbd>
                )}
              </div>

              {/* Grouped Command Palette Results (Responsive on Mobile & Desktop) */}
              {searchOpen && (
                <div className="fixed left-3 right-3 top-16 sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-2 w-auto sm:w-96 max-w-[calc(100vw-24px)] rounded-lg border border-white/[0.12] bg-[#11151f] p-2.5 z-50 space-y-2 overflow-hidden">
                  {/* Mobile Search Input inside Command Palette */}
                  <div className="relative flex sm:hidden items-center pb-1">
                    <Search className="absolute left-3 h-3.5 w-3.5 text-neutral-400 pointer-events-none" />
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={globalQuery}
                      onChange={(e) => setGlobalQuery(e.target.value)}
                      placeholder="Search issues and projects"
                      className="h-10 w-full rounded-xl border border-white/[0.1] bg-[#0c0f17] pl-8 pr-9 text-xs text-white placeholder-neutral-500 focus:border-emerald-400/50 focus:outline-none"
                    />
                    {globalQuery && (
                      <button
                        onClick={() => setGlobalQuery('')}
                        className="absolute right-2.5 text-neutral-400 hover:text-white p-1"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                  <div className="flex items-center justify-between px-2.5 py-1 border-b border-white/[0.06] text-[10px] text-neutral-500 font-mono">
                    <span className="flex items-center gap-1">
                      <Command className="h-3 w-3 text-neutral-400" />
                      <span>Search</span>
                    </span>
                    <button
                      onClick={() => setSearchOpen(false)}
                      className="text-neutral-400 hover:text-white cursor-pointer"
                    >
                      ESC
                    </button>
                  </div>

                  {matchedProjects.length === 0 && matchedTasks.length === 0 ? (
                    <div className="py-6 text-center text-xs text-neutral-500">
                      No matching results for "{globalQuery}"
                    </div>
                  ) : (
                    <>
                      {matchedProjects.length > 0 && (
                        <div>
                          <div className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
                            Projects
                          </div>
                          {matchedProjects.map((p) => (
                            <button
                              key={p._id}
                              onClick={() => {
                                setActiveProject(p);
                                onNavigate('board');
                                setSearchOpen(false);
                              }}
                              className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs text-neutral-200 hover:bg-white/[0.06] cursor-pointer"
                            >
                              <div className="flex items-center gap-2 truncate">
                                <FolderGit2 className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0" />
                                <span className="truncate">{p.title}</span>
                              </div>
                              <span className="font-mono text-[10px] text-neutral-500">{p.key}</span>
                            </button>
                          ))}
                        </div>
                      )}

                      {matchedTasks.length > 0 && (
                        <div>
                          <div className="px-2.5 py-1 text-xs font-medium text-neutral-500">
                          Tasks
                          </div>
                          {matchedTasks.slice(0, 5).map((t) => (
                            <button
                              key={t._id}
                              onClick={() => {
                                onNavigate('board');
                                setSearchOpen(false);
                              }}
                              className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs text-neutral-200 hover:bg-white/[0.06] cursor-pointer"
                            >
                              <div className="flex items-center gap-2 truncate">
                                <CheckCircle2 className="h-3.5 w-3.5 text-cyan-400 flex-shrink-0" />
                                <span className="truncate">{t.title}</span>
                              </div>
                              <span className="text-[10px] text-neutral-500 capitalize">
                                {t.column.replace('_', ' ')}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}

                      <div className="border-t border-white/[0.06] pt-1.5">
                        <button
                          onClick={() => {
                            onNavigate('ai');
                            setSearchOpen(false);
                          }}
                          className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs text-neutral-200 hover:bg-white/[0.06] cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            <span>Planning tools</span>
                          </div>
                          <span className="font-mono text-[10px] text-emerald-400/80">G A</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {isAuthenticated && <NotificationPopover onNavigate={onNavigate} />}

          {/* Account Menu (>=44x44px Touch Target) */}
          {isAuthenticated && user ? (
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                aria-label="Account menu"
                className="flex min-h-[44px] min-w-[44px] h-11 items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-[#11151f] px-2.5 text-left hover:border-white/[0.16] transition-colors cursor-pointer"
              >
                <div className="relative">
                  <Avatar name={user.name} className="h-7 w-7 text-xs" />
                </div>
                <div className="hidden sm:flex flex-col leading-tight">
                  <span className="text-xs font-semibold text-neutral-100">
                    {user.name}
                  </span>
                  <span className="text-[11px] text-neutral-400">{roleTheme.roleTitle}</span>
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-neutral-500" />
              </button>

              {dropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setDropdownOpen(false)}
                  />
                  <div className="fixed left-3 right-3 top-15 sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-2 w-auto sm:w-68 max-w-[calc(100vw-24px)] origin-top-right rounded-lg border border-white/[0.12] bg-[#11151f] p-1.5 z-50 overflow-hidden">
                    <div className="px-2.5 py-2.5 border-b border-white/[0.07]">
                      <div className="text-xs font-semibold text-white">{user.name}</div>
                      <div className="text-[11px] text-neutral-400 truncate">{user.email}</div>
                      <div className="mt-1 inline-flex items-center gap-1.5 text-[11px] text-emerald-400 font-medium">
                        <span>{user.title}</span>
                      </div>
                    </div>

                    <div className="pt-1 space-y-0.5">
                      <button
                        onClick={() => {
                          sessionStorage.setItem('pulsedev_profile_tab', 'directory');
                          window.dispatchEvent(new CustomEvent('pulsedev:profile-tab', { detail: 'directory' }));
                          setDropdownOpen(false);
                          onNavigate('profile');
                        }}
                        className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs text-neutral-300 hover:bg-white/[0.05] hover:text-white cursor-pointer"
                      >
                        <UserIcon className="h-3.5 w-3.5 text-neutral-400" />
                        <span>Profile & team directory</span>
                      </button>

                      <button
                        onClick={() => {
                          sessionStorage.setItem('pulsedev_profile_tab', 'settings');
                          window.dispatchEvent(new CustomEvent('pulsedev:profile-tab', { detail: 'settings' }));
                          setDropdownOpen(false);
                          onNavigate('profile');
                        }}
                        className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs text-neutral-300 hover:bg-white/[0.05] hover:text-white cursor-pointer"
                      >
                        <Settings className="h-3.5 w-3.5 text-neutral-400" />
                        <span>Settings</span>
                      </button>

                      <button
                        onClick={() => {
                          sessionStorage.setItem('pulsedev_profile_tab', 'settings');
                          window.dispatchEvent(new CustomEvent('pulsedev:profile-tab', { detail: 'password' }));
                          setDropdownOpen(false);
                          onNavigate('profile');
                        }}
                        className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs text-emerald-300 hover:bg-emerald-500/10 hover:text-emerald-200 cursor-pointer"
                      >
                        <KeyRound className="h-3.5 w-3.5 text-emerald-400" />
                        <span>Change password</span>
                      </button>

                      <div className="my-1 border-t border-white/[0.07]" />

                      <button
                        onClick={async () => {
                          setDropdownOpen(false);
                          await logout();
                          onNavigate('login');
                        }}
                        className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs text-rose-400 hover:bg-rose-500/10 cursor-pointer"
                      >
                        <LogOut className="h-3.5 w-3.5" />
                        <span>Log out</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              {activeRoute !== 'login' && (
                <button
                  onClick={() => onNavigate('login')}
                  className="rounded-md bg-emerald-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-600 transition-colors cursor-pointer"
                >
                  Sign in
                </button>
              )}
            </div>
          )}
        </div>
      </header>
    </>
  );
};

export default Navbar;
