import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  Bell,
  Check,
  CheckCheck,
  ShieldAlert,
  FolderGit2,
  ListTodo,
  UserCheck,
  ExternalLink,
  X,
} from 'lucide-react';

interface NotificationItem {
  _id: string;
  title: string;
  message: string;
  type: 'auth' | 'task' | 'project' | 'system';
  read: boolean;
  actorName: string;
  actorAvatar: string;
  createdAt: string;
}

interface NotificationPopoverProps {
  onNavigate?: (route: string) => void;
}

export const NotificationPopover: React.FC<NotificationPopoverProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const currentUserId = user?._id || '1';

  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [liveToast, setLiveToast] = useState<NotificationItem | null>(null);
  // Track locally read notification IDs per user so switching accounts preserves each user's unread state
  const [localReadMap, setLocalReadMap] = useState<Record<string, string[]>>({});
  const dropdownRef = useRef<HTMLDivElement>(null);
  const seenIdsRef = useRef<Set<string>>(new Set());
  const initialLoadDoneRef = useRef<boolean>(false);

  const showLiveToast = useCallback((notif: NotificationItem) => {
    setLiveToast(notif);
    setTimeout(() => {
      setLiveToast((prev) => (prev?._id === notif._id ? null : prev));
    }, 4000);
  }, []);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await api.notifications.getAll();
      if (res.success && Array.isArray(res.notifications)) {
        const incoming: NotificationItem[] = res.notifications;

        // Detect brand new notifications arriving from backend (e.g. @ai reply or teammate action)
        if (initialLoadDoneRef.current) {
          for (const item of incoming) {
            if (!seenIdsRef.current.has(item._id)) {
              seenIdsRef.current.add(item._id);
              if (isAdmin || item.type !== 'auth') {
                showLiveToast(item);
              }
            }
          }
        } else {
          incoming.forEach((item) => seenIdsRef.current.add(item._id));
          initialLoadDoneRef.current = true;
        }

        setNotifications((prev) => {
          // Keep any instant local notifications that haven't been replaced yet
          const backendTitles = new Set(incoming.map((b) => `${b.title}|${b.message}`));
          const remainingLocal = prev.filter(
            (p) => p._id.startsWith('live-') && !backendTitles.has(`${p.title}|${p.message}`)
          );
          return [...remainingLocal, ...incoming];
        });
      }
    } catch {
      // Keep existing notifications smoothly
    }
  }, [isAdmin, showLiveToast]);

  // Poll every 2.5s and re-fetch whenever active user changes
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 2500);
    return () => clearInterval(interval);
  }, [fetchNotifications, currentUserId]);

  // Listen to 0ms instant notifications from any user action in the app
  useEffect(() => {
    const handleInstant = (e: Event) => {
      const custom = e as CustomEvent<NotificationItem>;
      if (!custom.detail) return;
      const notif = custom.detail;
      seenIdsRef.current.add(notif._id);

      setNotifications((prev) => [notif, ...prev]);
      if (isAdmin || notif.type !== 'auth') {
        showLiveToast(notif);
      }
    };

    const handleRefresh = () => {
      fetchNotifications();
    };

    window.addEventListener('pulsedev:instant-notification', handleInstant);
    window.addEventListener('pulsedev:refresh-notifications', handleRefresh);
    return () => {
      window.removeEventListener('pulsedev:instant-notification', handleInstant);
      window.removeEventListener('pulsedev:refresh-notifications', handleRefresh);
    };
  }, [fetchNotifications, isAdmin, showLiveToast]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const userReadIds = localReadMap[currentUserId] || [];

  // Compute notifications visible to the current role (excluding chat messages so chat stays in chatbox only)
  const roleScopedNotifications = notifications
    .filter((n) => {
      if (!isAdmin && n.type === 'auth') return false;
      const t = (n.title || '').toLowerCase();
      if (t.includes('#engineering-sync') || t.includes('new message in #') || t.includes('mentioned a teammate')) {
        return false;
      }
      return true;
    })
    .map((n) => ({
      ...n,
      read: n.read || userReadIds.includes(n._id),
    }));

  const unreadCount = roleScopedNotifications.filter((n) => !n.read).length;

  const handleMarkAsRead = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    // Immediately mark read in both notifications array and per-user localReadMap so bell badge decrements in 0ms
    setNotifications((prev) =>
      prev.map((n) => (n._id === id ? { ...n, read: true } : n))
    );
    setLocalReadMap((prev) => {
      const existing = prev[currentUserId] || [];
      if (existing.includes(id)) return prev;
      return {
        ...prev,
        [currentUserId]: [...existing, id],
      };
    });
    if (!id.startsWith('live-')) {
      try {
        await api.notifications.markRead(id);
      } catch {
        // ignore
      }
    }
  };

  const handleMarkAllRead = async () => {
    const allIds = roleScopedNotifications.map((n) => n._id);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setLocalReadMap((prev) => ({
      ...prev,
      [currentUserId]: Array.from(new Set([...(prev[currentUserId] || []), ...allIds])),
    }));
    try {
      await api.notifications.markAllRead();
    } catch {
      // ignore
    }
  };

  const filteredNotifications = roleScopedNotifications.filter((n) => {
    if (filter === 'unread') return !n.read;
    return true;
  });

  const getIcon = (type: string) => {
    switch (type) {
      case 'auth':
        return <UserCheck className="h-3.5 w-3.5 text-cyan-400" />;
      case 'task':
        return <ListTodo className="h-3.5 w-3.5 text-amber-400" />;
      case 'project':
        return <FolderGit2 className="h-3.5 w-3.5 text-emerald-400" />;
      default:
        return <ShieldAlert className="h-3.5 w-3.5 text-indigo-400" />;
    }
  };

  return (
    <>
      {/* Live Real-Time Notification Toast Banner (Top-Right on desktop, centered within viewport on mobile) */}
      {liveToast && (
        <div
          onClick={() => {
            setLiveToast(null);
            setIsOpen(true);
          }}
          className="fixed top-15 left-3 right-3 sm:left-auto sm:right-5 z-50 flex items-start gap-3 w-auto sm:w-96 max-w-[calc(100vw-24px)] rounded-xl border border-white/[0.14] bg-[#14171f]/95 p-3.5 shadow-2xl backdrop-blur-xl cursor-pointer animate-page"
        >
          <img
            src={
              liveToast.actorAvatar ||
              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=64&h=64&q=80'
            }
            alt={liveToast.actorName}
            className="h-8 w-8 rounded-full object-cover border border-white/[0.1] flex-shrink-0 mt-0.5"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 truncate">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-xs font-semibold text-white truncate">
                  {liveToast.title}
                </span>
              </div>
              <span className="text-[10px] text-neutral-400 font-mono">Just now</span>
            </div>
            <p className="mt-1 text-xs text-neutral-300 line-clamp-2 leading-relaxed">
              {liveToast.message}
            </p>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setLiveToast(null);
            }}
            className="text-neutral-500 hover:text-white p-0.5 cursor-pointer"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => {
            setIsOpen(!isOpen);
            if (!isOpen) fetchNotifications();
          }}
          aria-label="Live Workspace Notifications"
          className="relative flex min-h-[44px] min-w-[44px] h-11 w-11 items-center justify-center rounded-xl border border-white/[0.08] bg-[#131519] text-neutral-300 hover:border-white/[0.16] hover:text-white transition-colors cursor-pointer"
          title="Live Workspace Notifications"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-indigo-500 px-1 text-[10px] font-bold text-white shadow-sm">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {isOpen && (
          <div className="fixed left-3 right-3 top-15 sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-2 w-auto sm:w-96 max-w-[calc(100vw-24px)] origin-top-right rounded-2xl border border-white/[0.12] bg-[#11151f] p-3 shadow-[0_20px_50px_rgba(0,0,0,0.85),0_0_30px_rgba(16,185,129,0.12)] z-50 animate-popover-pop overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400" />
            <div className="flex items-center justify-between border-b border-white/[0.07] pb-2.5 px-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-xs text-white">Live Notifications</span>
                {unreadCount > 0 && (
                  <span className="rounded bg-indigo-500/20 px-1.5 py-0.5 text-[10px] font-mono font-semibold text-indigo-300">
                    {unreadCount} new
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-neutral-400 hover:text-white hover:bg-white/[0.05] transition-colors cursor-pointer"
                  >
                    <CheckCheck className="h-3.5 w-3.5" />
                    <span>Mark all read</span>
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-neutral-500 hover:text-white transition-colors cursor-pointer p-1"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-1 pt-2 pb-2 px-1">
              <button
                onClick={() => setFilter('all')}
                className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors cursor-pointer ${
                  filter === 'all'
                    ? 'bg-white/[0.08] text-white'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                All ({roleScopedNotifications.length})
              </button>
              <button
                onClick={() => setFilter('unread')}
                className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors cursor-pointer ${
                  filter === 'unread'
                    ? 'bg-white/[0.08] text-indigo-300'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                Unread ({unreadCount})
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto space-y-1.5 pr-1">
              {filteredNotifications.length === 0 ? (
                <div className="py-8 text-center text-xs text-neutral-500">
                  No notifications to display
                </div>
              ) : (
                filteredNotifications.map((notif) => {
                  const rawDate = notif.createdAt ? new Date(notif.createdAt) : new Date();
                  const validDate = isNaN(rawDate.getTime()) ? new Date() : rawDate;

                  return (
                    <div
                      key={notif._id}
                      className={`flex items-start gap-2.5 rounded-lg p-2.5 transition-colors cursor-pointer ${
                        notif.read
                          ? 'bg-[#0e1014]/60 hover:bg-white/[0.03] text-neutral-400'
                          : 'bg-white/[0.05] hover:bg-white/[0.08] border-l-2 border-indigo-400 text-neutral-100'
                      }`}
                      onClick={() => {
                        if (!notif.read) {
                          handleMarkAsRead(notif._id, { stopPropagation: () => {} } as any);
                        }
                        if (notif.type === 'auth' && isAdmin && onNavigate) {
                          onNavigate('admin-audit');
                          setIsOpen(false);
                        } else if (notif.type === 'task' && onNavigate) {
                          onNavigate('board');
                          setIsOpen(false);
                        } else if (notif.type === 'project' && onNavigate) {
                          onNavigate('projects');
                          setIsOpen(false);
                        }
                      }}
                    >
                      <img
                        src={
                          notif.actorAvatar ||
                          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=64&h=64&q=80'
                        }
                        alt={notif.actorName}
                        className="h-7 w-7 rounded-full border border-white/[0.1] object-cover flex-shrink-0 mt-0.5"
                      />
                      <div className="flex-1 overflow-hidden">
                        <div className="flex items-center justify-between gap-1">
                          <div className="flex items-center gap-1.5 truncate">
                            {getIcon(notif.type)}
                            <span className="font-semibold text-xs text-white truncate">
                              {notif.title}
                            </span>
                          </div>
                          <span className="text-[10px] text-neutral-500 font-mono whitespace-nowrap">
                            {validDate.toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <p className="mt-0.5 text-[11px] leading-relaxed line-clamp-2 text-neutral-300">
                          {notif.message}
                        </p>
                      </div>
                      {!notif.read && (
                        <button
                          onClick={(e) => handleMarkAsRead(notif._id, e)}
                          className="text-neutral-500 hover:text-white p-1 flex-shrink-0 cursor-pointer"
                          title="Mark as read"
                        >
                          <Check className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {isAdmin && onNavigate && (
              <div className="mt-2 pt-2 border-t border-white/[0.07] px-1 flex items-center justify-between text-[11px]">
                <span className="text-neutral-500">Admin Security Feed</span>
                <button
                  onClick={() => {
                    setIsOpen(false);
                    onNavigate('admin-audit');
                  }}
                  className="flex items-center gap-1 text-indigo-300 hover:text-white font-medium cursor-pointer"
                >
                  <span>View Login & Access Audit</span>
                  <ExternalLink className="h-3 w-3" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default NotificationPopover;
