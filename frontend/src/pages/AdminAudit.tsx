import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  RefreshCw,
  Search,
  Lock,
  Users,
  X,
  CheckCircle2,
} from 'lucide-react';

interface AuditLogEntry {
  _id: string;
  action: string;
  userId?: string;
  performedBy?: string;
  userName?: string;
  performedByName?: string;
  userEmail?: string;
  userRole?: string;
  userAvatar?: string;
  userDepartment?: string;
  details?: string;
  ipAddress?: string;
  userAgent?: string;
  timestamp?: string;
  createdAt?: string;
}

export function formatAuditDateTime(raw?: string): { dateStr: string; timeStr: string } {
  const parsed = raw ? new Date(raw) : null;
  if (!parsed || Number.isNaN(parsed.getTime())) {
    return { dateStr: '-', timeStr: '' };
  }
  return {
    dateStr: parsed.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }),
    timeStr: parsed.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    }),
  };
}

export function formatAuditAction(action: string): string {
  const labels: Record<string, string> = {
    USER_LOGIN: 'Logged in',
    USER_LOGOUT: 'Logged out',
    USER_REGISTER: 'Registered',
    PASSWORD_CHANGED: 'Changed password',
    TASK_QA_APPROVE: 'Approved task',
    TASK_REJECT: 'Rejected task',
    TASK_DELETE: 'Deleted task',
    PROJECT_CREATE: 'Created project',
    ROLE_UPDATED: 'Changed a role',
    ADMIN_USER_CREATE: 'Added a user',
    ADMIN_USER_DELETE: 'Removed a user',
    IDOR_BLOCKED: 'Blocked an unauthorized change',
    SERVER_BOOTSTRAP: 'Server started',
  };
  return labels[action] || action;
}

export const AdminAudit: React.FC = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [teamUsers, setTeamUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusBanner, setStatusBanner] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const isAdmin = user?.role === 'admin';

  const fetchAdminData = async () => {
    setLoading(true);
    setLoadError(null);
    const [logsResult, usersResult] = await Promise.allSettled([
      api.auth.getAuditLogs(),
      api.auth.getUsers(),
    ]);
    const errors: string[] = [];

    if (logsResult.status === 'fulfilled' && logsResult.value.success && Array.isArray(logsResult.value.logs)) {
      setLogs(logsResult.value.logs);
    } else {
      setLogs([]);
      errors.push(
        logsResult.status === 'rejected'
          ? logsResult.reason?.message || 'Could not load security logs.'
          : logsResult.value.message || 'Could not load security logs.'
      );
    }

    if (usersResult.status === 'fulfilled' && usersResult.value.success && Array.isArray(usersResult.value.users)) {
      setTeamUsers(usersResult.value.users);
    } else {
      setTeamUsers([]);
      errors.push(
        usersResult.status === 'rejected'
          ? usersResult.reason?.message || 'Could not load team members.'
          : usersResult.value.message || 'Could not load team members.'
      );
    }

    setLoadError(errors.length ? errors.join(' ') : null);
    setLoading(false);
  };

  useEffect(() => {
    if (isAdmin) {
      fetchAdminData();
    }
  }, [isAdmin]);

  const handleRoleChange = async (targetUserId: string, newRole: string) => {
    try {
      const res = await api.auth.updateUserRole(targetUserId, newRole);
      if (res.success) {
        setStatusBanner(res.message || 'User role updated.');
        fetchAdminData();
      }
    } catch (err: any) {
      setStatusBanner(err.message || 'Failed to update role.');
    }
  };

  if (!isAdmin) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#0b0c0e] p-6 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/[0.08] bg-[#111317] text-neutral-400 mb-4">
          <Lock className="h-5 w-5" />
        </div>
        <h2 className="text-base font-semibold text-white">403 Forbidden — Restricted to Workspace Admins</h2>
        <p className="mt-1.5 max-w-sm text-xs text-neutral-400 leading-relaxed">
          User management and security logs require an administrator account.
        </p>
      </div>
    );
  }

  const filteredLogs = (logs || []).filter((log) => {
    const matchesType = filterType === 'ALL' || log?.action === filterType;
    const q = searchQuery.toLowerCase();
    const name = (log?.userName || log?.performedByName || '').toLowerCase();
    const email = (log?.userEmail || '').toLowerCase();
    const role = (log?.userRole || '').toLowerCase();
    const ip = (log?.ipAddress || '').toLowerCase();
    const details = (log?.details || '').toLowerCase();
    const matchesSearch =
      !q ||
      name.includes(q) ||
      email.includes(q) ||
      role.includes(q) ||
      ip.includes(q) ||
      details.includes(q);
    return matchesType && matchesSearch;
  });

  const loginCount = logs.filter((l) => l.action === 'USER_LOGIN').length;
  const registerCount = logs.filter((l) => l.action === 'USER_REGISTER').length;
  const otherCount = logs.length - loginCount - registerCount;

  return (
    <div className="min-w-0 flex-1 overflow-y-auto bg-[#0b0c0e] px-4 py-5 pb-[calc(6rem+env(safe-area-inset-bottom))] sm:px-6 sm:py-7">
      <div className="mx-auto min-w-0 max-w-6xl space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between border-b border-white/[0.07] pb-5">
          <div className="min-w-0">
            <h1 className="text-xl font-semibold text-white tracking-tight">
              User management and security logs
            </h1>
            <p className="text-[13px] text-neutral-400 mt-1">
              Manage team roles and review recent activity.
            </p>
          </div>

          <button
            onClick={fetchAdminData}
            className="flex min-h-10 items-center gap-1.5 rounded-lg border border-white/[0.1] bg-[#14161b] px-3 py-1.5 text-sm font-medium text-neutral-200 hover:border-white/[0.18] cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {loadError && (
          <div role="alert" className="rounded-lg border border-rose-500/25 bg-rose-500/10 px-4 py-3 text-xs text-rose-200">
            {loadError}
          </div>
        )}

        {statusBanner && (
          <div className="flex items-center justify-between rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-xs text-emerald-300">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              <span>{statusBanner}</span>
            </div>
            <button
              onClick={() => setStatusBanner(null)}
              aria-label="Dismiss message"
              className="flex min-h-10 min-w-10 items-center justify-center rounded-lg text-emerald-300 hover:bg-white/[0.05] hover:text-white"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        <div className="min-w-0 overflow-hidden rounded-xl border border-white/[0.07] bg-[#111317]">
          <div className="flex items-center justify-between gap-3 border-b border-white/[0.07] px-4 py-3.5 sm:px-5">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-emerald-400" />
              <div className="min-w-0">
                <h2 className="text-sm font-semibold text-white">Team members</h2>
                <p className="text-[11px] text-neutral-500">
                  Update a member’s role. Role changes are recorded in the security log.
                </p>
              </div>
            </div>
          </div>

          <div className="divide-y divide-white/[0.06]">
            {!loading && teamUsers.length === 0 ? (
              <div className="px-5 py-8 text-center text-xs text-neutral-400">
                No team members found.
              </div>
            ) : teamUsers.map((member) => {
              const isSelf = member._id === user?._id || member.email === user?.email;
              return (
                <div
                  key={member._id}
                  className="flex min-w-0 flex-col gap-3 px-4 py-3.5 hover:bg-white/[0.02] sm:flex-row sm:items-center sm:justify-between sm:px-5"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={member.avatar}
                      alt={member.name}
                      className="h-8 w-8 rounded-full object-cover border border-white/[0.08]"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-medium text-white truncate">
                          {member.name}
                        </span>
                        {isSelf && (
                          <span className="rounded bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-0.2 text-[10px] font-mono text-emerald-300">
                            Active Admin
                          </span>
                        )}
                      </div>
                      <div className="truncate text-sm text-neutral-400">
                        {member.email} · {member.title}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5 sm:flex-shrink-0">
                    <select
                      aria-label={`Role for ${member.name}`}
                      value={member.role}
                      disabled={isSelf}
                      onChange={(e) => handleRoleChange(member._id, e.target.value)}
                      className="min-h-10 rounded-lg border border-white/[0.1] bg-[#0c0e13] px-2.5 py-1.5 text-sm text-neutral-200 focus:outline-none disabled:opacity-50"
                    >
                      <option value="admin">admin</option>
                      <option value="lead">lead</option>
                      <option value="developer">developer</option>
                      <option value="qa">qa</option>
                      <option value="guest">guest</option>
                    </select>

                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Hairline Summary Strip */}
        <div className="grid grid-cols-2 divide-y divide-white/[0.07] rounded-xl border border-white/[0.07] bg-[#111317] lg:grid-cols-4 lg:divide-x lg:divide-y-0">
          <div className="p-4">
            <div className="text-xs text-neutral-400">Total Audit Events</div>
            <div className="mt-1.5 text-2xl font-semibold text-white tabular-nums">{logs.length}</div>
          </div>
          <div className="p-4">
            <div className="text-xs text-neutral-400">Member Sign-ins</div>
            <div className="mt-1.5 text-2xl font-semibold text-white tabular-nums">{loginCount}</div>
          </div>
          <div className="p-4">
            <div className="text-xs text-neutral-400">New Registrations</div>
            <div className="mt-1.5 text-2xl font-semibold text-white tabular-nums">{registerCount}</div>
          </div>
          <div className="p-4">
            <div className="text-xs text-neutral-400">Security & RBAC Actions</div>
            <div className="mt-1.5 text-2xl font-semibold text-white tabular-nums">{otherCount}</div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'ALL', label: 'All events' },
              { id: 'USER_LOGIN', label: 'Sign-ins' },
              { id: 'ROLE_UPDATED', label: 'Role changes' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterType(tab.id)}
                className={`min-h-10 rounded-lg px-2.5 py-1.5 text-sm font-medium transition-colors cursor-pointer ${
                  filterType === tab.id
                    ? 'bg-white/[0.09] text-white'
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-white/[0.04]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search user, email, role, or IP..."
              className="min-h-11 w-full rounded-lg border border-white/[0.08] bg-[#111317] pl-8 pr-3 py-1.5 text-sm text-white placeholder-neutral-500 focus:border-white/[0.18] focus:outline-none"
            />
          </div>
        </div>

        {/* Audit events */}
        <div className="min-w-0 overflow-hidden rounded-xl border border-white/[0.07] bg-[#111317]">
          <div className="hidden grid-cols-12 border-b border-white/[0.07] bg-[#0e1014] px-4 py-2.5 text-xs font-medium text-neutral-400 md:grid">
            <div className="col-span-4">Member</div>
            <div className="col-span-2">Event</div>
            <div className="col-span-4">Details</div>
            <div className="col-span-2 text-right">Timestamp</div>
          </div>

          {loading ? (
            <div className="py-12 text-center text-sm text-neutral-400">
              Loading security events...
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="py-12 text-center text-sm text-neutral-500">
              No matching security events found.
            </div>
          ) : (
            <div className="divide-y divide-white/[0.06]">
              {filteredLogs.map((log, index) => {
                const { dateStr, timeStr } = formatAuditDateTime(log.createdAt || log.timestamp);
                const roleLabel = (log.userRole || 'member').toLowerCase();
                const memberName = log.userName || log.performedByName || 'Unknown user';
                const initials = memberName
                  .split(/\s+/)
                  .filter(Boolean)
                  .slice(0, 2)
                  .map((part) => part[0].toUpperCase())
                  .join('');
                const date = log.createdAt || log.timestamp
                  ? new Date(log.createdAt || log.timestamp || '')
                  : null;
                const mobileTimestamp =
                  date && !Number.isNaN(date.getTime())
                    ? date.toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })
                    : 'Time unavailable';
                const eventLabel = formatAuditAction(log.action);

                return (
                  <React.Fragment key={log._id || index}>
                    <div className="hidden grid-cols-12 items-center px-4 py-3 text-sm transition-colors hover:bg-white/[0.02] md:grid">
                      <div className="col-span-4 flex min-w-0 items-center gap-2.5 pr-3">
                        {log.userAvatar ? (
                          <img
                            src={log.userAvatar}
                            alt=""
                            className="h-8 w-8 shrink-0 rounded-full object-cover"
                          />
                        ) : (
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/[0.08] text-xs text-neutral-300">
                            {initials || '?'}
                          </span>
                        )}
                        <div className="min-w-0">
                          <div className="truncate font-medium text-neutral-100">
                            {memberName}
                          </div>
                          <div className="truncate text-xs text-neutral-500">
                            {log.userEmail || 'Email unavailable'} ·{' '}
                            <span className="capitalize">{roleLabel}</span>
                          </div>
                        </div>
                      </div>

                      <div className="col-span-2 min-w-0 pr-2 text-neutral-200">
                        {eventLabel}
                      </div>

                      <div className="col-span-4 min-w-0 break-words pr-3 text-neutral-300">
                        <span>{log.details || 'No details recorded.'}</span>
                        <span className="mt-1 block text-xs text-neutral-500">
                          IP: {log.ipAddress || 'Not recorded'}
                        </span>
                      </div>

                      <div className="col-span-2 text-right text-xs text-neutral-400">
                        <div>{dateStr}</div>
                        <div className="text-neutral-500">{timeStr}</div>
                      </div>
                    </div>

                    <article className="space-y-2.5 px-4 py-3.5 text-sm md:hidden">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/[0.08] text-xs font-medium text-neutral-200">
                          {initials || '?'}
                        </span>
                        <div className="min-w-0">
                          <div className="truncate font-medium text-neutral-100">
                            {memberName}
                          </div>
                          <div className="truncate text-xs text-neutral-500">
                            {log.userEmail || 'Email unavailable'}
                          </div>
                        </div>
                      </div>
                      <p className="font-medium text-neutral-200">{eventLabel}</p>
                      <p className="break-words leading-relaxed text-neutral-300">
                        {log.details || 'No details recorded.'}
                      </p>
                      <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-xs text-neutral-500">
                        <time className="whitespace-nowrap">
                          {mobileTimestamp}
                        </time>
                        <span className="min-w-0 break-all">
                          IP: {log.ipAddress || 'Not recorded'}
                        </span>
                      </div>
                    </article>
                  </React.Fragment>
                );
              })}
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default AdminAudit;
