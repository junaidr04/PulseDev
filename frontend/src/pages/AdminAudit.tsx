import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  RefreshCw,
  Search,
  Lock,
  ShieldAlert,
  UserCheck,
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

const FALLBACK_AUDIT_LOGS: AuditLogEntry[] = [
  {
    _id: 'aud-1',
    action: 'USER_LOGIN',
    userId: '1',
    userName: 'Alex Chen',
    userEmail: 'alex.chen@pulsedev.io',
    userRole: 'admin',
    userDepartment: 'Core Architecture',
    userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=128&h=128&q=80',
    details: 'Signed in via JWT password verification',
    ipAddress: '127.0.0.1',
    userAgent: 'Chrome 134 / macOS Workspace',
    createdAt: new Date(Date.now() - 120000).toISOString(),
  },
  {
    _id: 'aud-2',
    action: 'USER_LOGIN',
    userId: '2',
    userName: 'Priya Patel',
    userEmail: 'priya.patel@pulsedev.io',
    userRole: 'lead',
    userDepartment: 'Platform Engineering',
    userAvatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=128&h=128&q=80',
    details: 'Authenticated into Sprint 44 workspace',
    ipAddress: '10.0.4.18',
    userAgent: 'Firefox 132 / Ubuntu Linux',
    createdAt: new Date(Date.now() - 1800000).toISOString(),
  },
  {
    _id: 'aud-3',
    action: 'USER_REGISTER',
    userId: '4',
    userName: 'Sophia Laurent',
    userEmail: 'sophia.laurent@pulsedev.io',
    userRole: 'qa',
    userDepartment: 'Quality Engineering',
    userAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=128&h=128&q=80',
    details: 'New account registered (QA Automation Lead)',
    ipAddress: '10.0.8.42',
    userAgent: 'Safari 18 / macOS Sonoma',
    createdAt: new Date(Date.now() - 5400000).toISOString(),
  },
  {
    _id: 'aud-4',
    action: 'USER_LOGIN',
    userId: '3',
    userName: 'Marcus Vance',
    userEmail: 'marcus.vance@pulsedev.io',
    userRole: 'developer',
    userDepartment: 'Product Engineering',
    userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=128&h=128&q=80',
    details: 'Signed in to submit PR for PAY-101',
    ipAddress: '192.168.1.44',
    userAgent: 'Chrome 134 / macOS Workspace',
    createdAt: new Date(Date.now() - 7200000).toISOString(),
  },
];

export function formatAuditDateTime(raw?: string): { dateStr: string; timeStr: string } {
  const parsed = raw ? new Date(raw) : new Date();
  const validDate = isNaN(parsed.getTime()) ? new Date() : parsed;
  return {
    dateStr: validDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }),
    timeStr: validDate.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    }),
  };
}

export const AdminAudit: React.FC = () => {
  const { user, startImpersonation } = useAuth();
  const [logs, setLogs] = useState<AuditLogEntry[]>(FALLBACK_AUDIT_LOGS);
  const [teamUsers, setTeamUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusBanner, setStatusBanner] = useState<string | null>(null);

  // Explicit Confirmation Modal state for Admin Impersonation
  const [impersonateTarget, setImpersonateTarget] = useState<any | null>(null);
  const [impersonateReason, setImpersonateReason] = useState(
    'Verify role-scoped sprint board permissions and QA workflow'
  );
  const [impersonateSubmitting, setImpersonateSubmitting] = useState(false);

  const isAdmin = user?.role === 'admin';

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const [logsRes, usersRes] = await Promise.all([
        api.auth.getAuditLogs(),
        api.auth.getUsers(),
      ]);
      if (logsRes.success && Array.isArray(logsRes.logs) && logsRes.logs.length > 0) {
        setLogs(logsRes.logs);
      }
      if (usersRes.success && Array.isArray(usersRes.users)) {
        setTeamUsers(usersRes.users);
      }
    } catch {
      // Keep fallback logs
    } finally {
      setLoading(false);
    }
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

  const handleConfirmImpersonation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!impersonateTarget) return;
    setImpersonateSubmitting(true);
    try {
      await startImpersonation(impersonateTarget._id, impersonateReason.trim());
      setImpersonateTarget(null);
    } catch (err: any) {
      setStatusBanner(err.message || 'Failed to start impersonation.');
    } finally {
      setImpersonateSubmitting(false);
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
          User management, audited impersonation, and security logs require the Principal Architect (`admin`) role.
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
    <div className="flex-1 overflow-y-auto bg-[#0b0c0e] px-6 py-7 pb-24">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between border-b border-white/[0.07] pb-5">
          <div>
            <h1 className="text-xl font-semibold text-white tracking-tight">
              Admin Dashboard — User Management & Security Audit
            </h1>
            <p className="text-[13px] text-neutral-400 mt-1">
              Manage team RBAC roles, start audited support impersonation sessions, and inspect security logs.
            </p>
          </div>

          <button
            onClick={fetchAdminData}
            className="flex items-center gap-1.5 rounded-lg border border-white/[0.1] bg-[#14161b] px-3 py-1.5 text-xs font-medium text-neutral-200 hover:border-white/[0.18] cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {statusBanner && (
          <div className="flex items-center justify-between rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-xs text-emerald-300">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              <span>{statusBanner}</span>
            </div>
            <button onClick={() => setStatusBanner(null)} className="text-emerald-300 hover:text-white">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Admin User Management & Audited Impersonation Section */}
        <div className="rounded-xl border border-white/[0.07] bg-[#111317] overflow-hidden">
          <div className="border-b border-white/[0.07] px-5 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-emerald-400" />
              <div>
                <h2 className="text-[13px] font-semibold text-white">
                  User Management & Audited Impersonation
                </h2>
                <p className="text-[11px] text-neutral-500">
                  Requires `users.manage` and `users.impersonate` permissions. All actions are recorded in the security audit log.
                </p>
              </div>
            </div>
          </div>

          <div className="divide-y divide-white/[0.06]">
            {teamUsers.map((member) => {
              const isSelf = member._id === user?._id || member.email === user?.email;
              return (
                <div
                  key={member._id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-3.5 hover:bg-white/[0.02]"
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
                      <div className="text-xs text-neutral-400 truncate">
                        {member.email} · {member.title}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 flex-shrink-0">
                    <select
                      aria-label={`Role for ${member.name}`}
                      value={member.role}
                      disabled={isSelf}
                      onChange={(e) => handleRoleChange(member._id, e.target.value)}
                      className="rounded-lg border border-white/[0.1] bg-[#0c0e13] px-2.5 py-1.5 text-xs font-mono text-neutral-200 focus:outline-none disabled:opacity-50"
                    >
                      <option value="admin">admin</option>
                      <option value="lead">lead</option>
                      <option value="developer">developer</option>
                      <option value="qa">qa</option>
                      <option value="guest">guest</option>
                    </select>

                    {!isSelf && (
                      <button
                        type="button"
                        onClick={() => setImpersonateTarget(member)}
                        className="flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-300 hover:bg-amber-500/20 cursor-pointer"
                      >
                        <UserCheck className="h-3.5 w-3.5" />
                        <span>Impersonate User</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Hairline Summary Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 rounded-xl border border-white/[0.07] bg-[#111317] divide-y lg:divide-y-0 lg:divide-x divide-white/[0.07]">
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
              { id: 'ADMIN_IMPERSONATE_START', label: 'Impersonations' },
              { id: 'ROLE_UPDATED', label: 'Role changes' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterType(tab.id)}
                className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
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
              className="w-full rounded-lg border border-white/[0.08] bg-[#111317] pl-8 pr-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:border-white/[0.18] focus:outline-none"
            />
          </div>
        </div>

        {/* Audit Table */}
        <div className="rounded-xl border border-white/[0.07] bg-[#111317] overflow-hidden">
          <div className="grid grid-cols-12 border-b border-white/[0.07] bg-[#0e1014] px-4 py-2.5 text-[11px] font-medium text-neutral-400">
            <div className="col-span-4">Member</div>
            <div className="col-span-2">Event</div>
            <div className="col-span-4">Details</div>
            <div className="col-span-2 text-right">Timestamp</div>
          </div>

          <div className="divide-y divide-white/[0.06]">
            {filteredLogs.length === 0 ? (
              <div className="py-12 text-center text-xs text-neutral-500">
                No matching security events found.
              </div>
            ) : (
              filteredLogs.map((log, index) => {
                const { dateStr, timeStr } = formatAuditDateTime(log.createdAt || log.timestamp);
                const roleLabel = (log.userRole || 'member').toLowerCase();

                return (
                  <div
                    key={log._id || index}
                    className="grid grid-cols-12 items-center px-4 py-3 text-xs hover:bg-white/[0.02] transition-colors"
                  >
                    <div className="col-span-4 flex items-center gap-2.5 pr-3 min-w-0">
                      <img
                        src={
                          log.userAvatar ||
                          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=128&h=128&q=80'
                        }
                        alt={log.userName || 'User'}
                        className="h-7 w-7 rounded-full object-cover flex-shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="font-medium text-neutral-100 truncate">
                          {log.userName || log.performedByName || 'Alex Chen'}
                        </div>
                        <div className="text-[11px] text-neutral-500 truncate">
                          {log.userEmail || 'alex.chen@pulsedev.io'} ·{' '}
                          <span className="capitalize">{roleLabel}</span>
                        </div>
                      </div>
                    </div>

                    <div className="col-span-2 pr-2">
                      <span className="inline-flex items-center rounded border border-white/[0.07] bg-white/[0.03] px-2 py-0.5 font-mono text-[10px] text-neutral-300">
                        {log.action}
                      </span>
                    </div>

                    <div className="col-span-4 pr-3 text-neutral-300 truncate">
                      <span>{log.details}</span>
                      <span className="block text-[11px] font-mono text-neutral-500 mt-0.5">
                        IP: {log.ipAddress || '127.0.0.1'}
                      </span>
                    </div>

                    <div className="col-span-2 text-right font-mono text-[11px] text-neutral-400">
                      <div>{dateStr}</div>
                      <div className="text-neutral-500">{timeStr}</div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Explicit Confirmation Modal for Admin Impersonation */}
      {impersonateTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4"
          onClick={() => setImpersonateTarget(null)}
        >
          <div
            className="relative overflow-hidden w-full max-w-md rounded-2xl border border-amber-500/30 bg-[#11151f] p-6 shadow-2xl animate-modal-pop"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400" />
            <div className="flex items-center justify-between border-b border-white/[0.07] pb-3.5">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-amber-400" />
                <h3 className="text-sm font-semibold text-white">Confirm Admin Impersonation</h3>
              </div>
              <button
                onClick={() => setImpersonateTarget(null)}
                className="text-neutral-400 hover:text-white cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmImpersonation} className="mt-4 space-y-4 text-xs">
              <div className="rounded-xl border border-white/[0.08] bg-[#0b0d13] p-3 flex items-center gap-3">
                <img
                  src={impersonateTarget.avatar}
                  alt={impersonateTarget.name}
                  className="h-10 w-10 rounded-full object-cover"
                />
                <div>
                  <div className="font-semibold text-white">{impersonateTarget.name}</div>
                  <div className="text-neutral-400">{impersonateTarget.email}</div>
                  <div className="font-mono text-[10px] text-amber-400 uppercase mt-0.5">
                    Target Role: {impersonateTarget.role}
                  </div>
                </div>
              </div>

              <p className="text-neutral-300 leading-relaxed">
                You are about to start a temporary, audited impersonation session as{' '}
                <strong className="text-white">{impersonateTarget.name}</strong>. This action will be recorded in the security audit log with your administrator identity and timestamp.
              </p>

              <div>
                <label className="block font-medium text-neutral-300 mb-1.5">
                  Audit Reason / Support Ticket
                </label>
                <input
                  type="text"
                  required
                  value={impersonateReason}
                  onChange={(e) => setImpersonateReason(e.target.value)}
                  className="w-full rounded-lg border border-white/[0.1] bg-[#0b0d13] px-3 py-2 text-white focus:border-amber-400/50 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setImpersonateTarget(null)}
                  className="rounded-lg border border-white/[0.1] px-3.5 py-2 text-xs text-neutral-300 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={impersonateSubmitting}
                  className="rounded-lg bg-amber-400 px-4 py-2 text-xs font-semibold text-[#090b10] hover:bg-amber-300 cursor-pointer"
                >
                  {impersonateSubmitting ? 'Starting...' : `Impersonate ${impersonateTarget.name}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAudit;
