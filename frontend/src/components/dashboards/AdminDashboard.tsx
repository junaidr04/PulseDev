import React, { useEffect, useState } from 'react';
import { Project, Task } from '../../context/ProjectContext';
import { User } from '../../context/AuthContext';
import { RoleThemeConfig } from '../../theme/roleTheme';
import {
  RoleSurfaceCard,
  StaggerContainer,
  StaggerItem,
  useCountUp,
} from '../ui/RoleSharedUI';
import api from '../../services/api';
import { ArrowUpRight, Plus, ShieldCheck, Users } from 'lucide-react';

export interface RoleCockpitProps {
  user: User | null;
  theme: RoleThemeConfig;
  projects: Project[];
  activeProject: Project | null;
  tasks: Task[];
  onNavigate: (route: string) => void;
  onOpenNewTask: () => void;
  onOpenNewProject: () => void;
  updateTaskColumn: (
    taskId: string,
    newColumn: 'backlog' | 'in_progress' | 'in_review' | 'completed'
  ) => Promise<void>;
  rejectTask: (taskId: string, reason: string, category?: string) => Promise<void>;
  approveTask: (taskId: string) => Promise<void>;
}

interface AuditLogEntry {
  _id: string;
  action: string;
  performedByName?: string;
  details?: string;
  createdAt?: string;
  timestamp?: string;
}

export const AdminDashboard: React.FC<RoleCockpitProps> = ({
  tasks,
  projects,
  onNavigate,
  onOpenNewProject,
  onOpenNewTask,
}) => {
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [auditLoading, setAuditLoading] = useState(true);
  const [auditError, setAuditError] = useState<string | null>(null);

  const completedCount = tasks.filter((task) => task.column === 'completed').length;
  const openIssuesCount = tasks.length - completedCount;
  const completionPct =
    tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;
  const animatedCompletion = useCountUp(completionPct);
  const animatedIssues = useCountUp(tasks.length);
  const animatedOpenIssues = useCountUp(openIssuesCount);
  const animatedProjects = useCountUp(projects.length);

  useEffect(() => {
    let active = true;

    api.auth
      .getAuditLogs()
      .then((response) => {
        if (!active) return;
        if (response.success && Array.isArray(response.logs)) {
          setAuditLogs(response.logs.slice(0, 5));
          return;
        }
        setAuditError(response.message || 'Could not load security activity.');
      })
      .catch((error: unknown) => {
        if (!active) return;
        setAuditError(
          error instanceof Error
            ? error.message
            : 'Could not load security activity.'
        );
      })
      .finally(() => {
        if (active) setAuditLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const openUserManagement = () => {
    sessionStorage.setItem('pulsedev_admin_audit_focus', 'impersonation');
    onNavigate('admin-audit');
  };

  return (
    <StaggerContainer className="space-y-5">
      <StaggerItem className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Admin overview</h1>
          <p className="mt-1 text-sm text-neutral-400">
            Review workspace activity and manage users.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onOpenNewProject}
            className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm text-neutral-200 transition-colors hover:bg-white/[0.06]"
          >
            <Plus className="h-4 w-4" />
            New project
          </button>
          <button
            type="button"
            onClick={onOpenNewTask}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-3 py-2 text-sm font-medium text-neutral-950 transition-colors hover:bg-emerald-400"
          >
            <Plus className="h-4 w-4" />
            New task
          </button>
        </div>
      </StaggerItem>

      <StaggerItem className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <RoleSurfaceCard className="space-y-2">
          <span className="text-sm text-neutral-400">Issues completed</span>
          <div className="text-2xl font-semibold tabular-nums text-white">
            {tasks.length > 0 ? `${animatedCompletion}%` : '—'}
          </div>
          <p className="text-xs text-neutral-400">
            {tasks.length > 0
              ? `${completedCount} of ${animatedIssues} issues`
              : 'No issues in this workspace yet.'}
          </p>
          {tasks.length > 0 && (
            <div
              role="progressbar"
              aria-label="Issue completion"
              aria-valuenow={completionPct}
              aria-valuemin={0}
              aria-valuemax={100}
              className="h-1.5 overflow-hidden rounded-full bg-white/[0.08]"
            >
              <div
                className="h-full rounded-full bg-emerald-400 transition-[width] duration-300"
                style={{ width: `${completionPct}%` }}
              />
            </div>
          )}
        </RoleSurfaceCard>

        <RoleSurfaceCard className="space-y-2">
          <span className="text-sm text-neutral-400">Open issues</span>
          <div className="text-2xl font-semibold tabular-nums text-white">
            {animatedOpenIssues}
          </div>
          <p className="text-xs text-neutral-400">
            Issues not marked as complete
          </p>
        </RoleSurfaceCard>

        <RoleSurfaceCard className="space-y-2">
          <span className="text-sm text-neutral-400">Projects</span>
          <div className="text-2xl font-semibold tabular-nums text-white">
            {animatedProjects}
          </div>
          <p className="text-xs text-neutral-400">Projects in this workspace</p>
        </RoleSurfaceCard>
      </StaggerItem>

      <StaggerItem>
        <RoleSurfaceCard className="space-y-4">
          <div className="flex flex-col gap-3 border-b border-white/[0.06] pb-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-sm font-semibold text-white">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                Security activity
              </h2>
              <p className="mt-1 text-xs text-neutral-400">
                Recent events recorded for this workspace.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={openUserManagement}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-300 transition-colors hover:text-white"
              >
                <Users className="h-3.5 w-3.5" />
                Manage users
              </button>
              <button
                type="button"
                onClick={() => onNavigate('admin-audit')}
                className="inline-flex items-center gap-1 text-xs font-medium text-neutral-300 transition-colors hover:text-white"
              >
                View all logs
                <ArrowUpRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {auditLoading ? (
            <p className="py-3 text-sm text-neutral-400">
              Loading security activity...
            </p>
          ) : auditError ? (
            <p role="alert" className="py-3 text-sm text-rose-300">
              {auditError}
            </p>
          ) : auditLogs.length === 0 ? (
            <p className="py-3 text-sm text-neutral-400">
              No security events have been recorded yet.
            </p>
          ) : (
            <ul className="divide-y divide-white/[0.06]">
              {auditLogs.map((log) => {
                const rawDate = log.createdAt || log.timestamp;
                const date = rawDate ? new Date(rawDate) : null;
                const dateLabel =
                  date && !Number.isNaN(date.getTime())
                    ? date.toLocaleString()
                    : null;

                return (
                  <li
                    key={log._id}
                    className="flex flex-col gap-1 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-start sm:justify-between sm:gap-4"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-neutral-200">
                        {log.action}
                        {log.performedByName
                          ? ` · ${log.performedByName}`
                          : ''}
                      </p>
                      {log.details && (
                        <p className="mt-1 break-words text-xs text-neutral-400">
                          {log.details}
                        </p>
                      )}
                    </div>
                    {dateLabel && (
                      <time
                        dateTime={date?.toISOString()}
                        className="shrink-0 text-xs text-neutral-500"
                      >
                        {dateLabel}
                      </time>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </RoleSurfaceCard>
      </StaggerItem>
    </StaggerContainer>
  );
};

export default AdminDashboard;
