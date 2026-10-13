import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useProjects } from '../context/ProjectContext';
import { getRoleTheme } from '../theme/roleTheme';
import NotificationPopover from './NotificationPopover';
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
  Sparkles,
  KeyRound,
} from 'lucide-react';

interface NavbarProps {
  onNavigate: (route: string) => void;
  activeRoute: string;
}

export const PulseBrandLogo: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ size = 'md' }) => {
  const boxClass =
    size === 'lg' ? 'h-11 w-11 rounded-2xl' : size === 'sm' ? 'h-7 w-7 rounded-lg' : 'h-8.5 w-8.5 rounded-xl';
  const textClass =
    size === 'lg' ? 'text-2xl' : size === 'sm' ? 'text-sm' : 'text-[16px]';

  return (
    <div className="flex items-center gap-2.5 select-none group">
      {/* Bespoke Geometric Pulse Prism Emblem */}
      <div
        className={`relative flex ${boxClass} items-center justify-center bg-[#0d111a] p-[1px] shadow-lg shadow-emerald-500/10 transition-transform duration-200 group-hover:scale-[1.03]`}
      >
        <div className="absolute inset-0 rounded-[inherit] bg-gradient-to-br from-emerald-400 via-teal-500/60 to-cyan-400 opacity-85 group-hover:opacity-100 transition-opacity" />
        <div className="relative flex h-full w-full items-center justify-center rounded-[calc(inherit-1px)] bg-[#090c12]">
          <svg
            viewBox="0 0 28 28"
            fill="none"
            className="h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="pulseBrandGrad" x1="2" y1="4" x2="26" y2="24" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#34d399" />
                <stop offset="50%" stopColor="#2dd4bf" />
                <stop offset="100%" stopColor="#22d3ee" />
              </linearGradient>
            </defs>
            {/* Outer Precision Diamond Frame */}
            <path
              d="M14 3L24.5 9V19L14 25L3.5 19V9L14 3Z"
              stroke="url(#pulseBrandGrad)"
              strokeWidth="1.4"
              strokeOpacity="0.45"
            />
            {/* Dynamic Telemetry Pulse Wave */}
            <path
              d="M5.5 14.5H9.2L11.8 8.5L15.6 19.5L18.2 12.5L20.2 14.5H22.5"
              stroke="url(#pulseBrandGrad)"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Glowing Core Node */}
            <circle cx="22.5" cy="14.5" r="1.8" fill="#34d399" />
          </svg>
        </div>
      </div>

      {/* Bespoke Wordmark */}
      <div className="flex items-baseline gap-0.5">
        <span className={`${textClass} font-extrabold tracking-[-0.04em] text-white`}>
          Pulse
        </span>
        <span
          className={`${textClass} font-extrabold tracking-[-0.04em] bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent`}
        >
          Dev
        </span>
        <span className="ml-1 h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#10b981]" />
      </div>
    </div>
  );
};

export const Navbar: React.FC<NavbarProps> = ({
  onNavigate,
  activeRoute,
}) => {
  const { user, logout, isAuthenticated } = useAuth();
  const { projects, tasks, activeProject, setActiveProject } = useProjects();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const roleTheme = getRoleTheme(user?.role);

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
      <header className="sticky top-0 z-30 flex h-15 w-full items-center justify-between border-b border-white/[0.07] bg-[#090b10]/90 px-3 sm:px-4 backdrop-blur-xl">
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
                Initiatives
              </button>
              <span className="text-neutral-700">/</span>
              <button
                onClick={() => onNavigate('board')}
                className="flex items-center gap-1.5 font-medium text-neutral-200 hover:text-white transition-colors cursor-pointer py-1"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
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
                  placeholder="Search issues, initiatives, or jump to..."
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
                <div className="fixed left-3 right-3 top-16 sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-2 w-auto sm:w-96 max-w-[calc(100vw-24px)] rounded-2xl border border-white/[0.12] bg-[#11151f] p-2.5 shadow-[0_20px_50px_rgba(0,0,0,0.85),0_0_30px_rgba(16,185,129,0.12)] z-50 space-y-2 animate-popover-pop overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400" />
                  {/* Mobile Search Input inside Command Palette */}
                  <div className="relative flex sm:hidden items-center pb-1">
                    <Search className="absolute left-3 h-3.5 w-3.5 text-neutral-400 pointer-events-none" />
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={globalQuery}
                      onChange={(e) => setGlobalQuery(e.target.value)}
                      placeholder="Search issues, initiatives, or jump to..."
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
                      <Command className="h-3 w-3 text-emerald-400" />
                      <span>COMMAND PALETTE</span>
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
                            Initiatives
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
                          <div className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
                            Cycle Issues
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
                          className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs text-emerald-300 hover:bg-emerald-500/10 cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
                            <span>Open AI Sprint & Story Planner</span>
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
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="h-7 w-7 rounded-full object-cover ring-1"
                    style={{ borderColor: roleTheme.accentHex }}
                  />
                  <span
                    className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full ring-2 ring-[#11151f]"
                    style={{ backgroundColor: roleTheme.accentHex }}
                  />
                </div>
                <div className="hidden sm:flex flex-col leading-tight">
                  <span className="text-xs font-semibold text-neutral-100">
                    {user.name}
                  </span>
                  <span
                    className="font-mono text-[9px] font-semibold tracking-wider uppercase"
                    style={{ color: roleTheme.accentHex }}
                  >
                    {roleTheme.shortBadge}
                  </span>
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-neutral-500" />
              </button>

              {dropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setDropdownOpen(false)}
                  />
                  <div className="fixed left-3 right-3 top-15 sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-2 w-auto sm:w-68 max-w-[calc(100vw-24px)] origin-top-right rounded-2xl border border-white/[0.12] bg-[#11151f] p-1.5 shadow-[0_20px_50px_rgba(0,0,0,0.85),0_0_30px_rgba(16,185,129,0.12)] z-50 animate-popover-pop overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400" />
                    <div className="px-2.5 py-2.5 border-b border-white/[0.07]">
                      <div className="text-xs font-semibold text-white">{user.name}</div>
                      <div className="text-[11px] text-neutral-400 truncate">{user.email}</div>
                      <div className="mt-1 inline-flex items-center gap-1.5 text-[11px] text-emerald-400 font-medium">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
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
                  className="rounded-lg bg-gradient-to-r from-emerald-400 to-cyan-400 px-3 py-1.5 text-xs font-semibold text-[#090b10] hover:opacity-95 transition-opacity cursor-pointer"
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
