import React, { useState } from 'react';
import { ArrowRight, Check, X } from 'lucide-react';
import { Project, Task } from '../../context/ProjectContext';
import { User } from '../../context/AuthContext';
import { resolveRoleKey } from '../../theme/roleTheme';

interface RoleDashboardProps {
  user: User | null;
  projects: Project[];
  activeProject: Project | null;
  tasks: Task[];
  onNavigate: (route: string) => void;
  onOpenNewTask: () => void;
  onOpenNewProject: () => void;
  updateTaskColumn: (
    taskId: string,
    newColumn: 'backlog' | 'in_progress' | 'in_review' | 'completed',
    overrideQa?: boolean
  ) => Promise<void>;
  rejectTask: (taskId: string, reason: string, category?: string) => Promise<void>;
  approveTask: (taskId: string) => Promise<void>;
}

const roleCopy = {
  admin: {
    title: 'Workspace overview',
    description: 'Review issues and manage the team workspace.',
  },
  lead: {
    title: 'Team issues',
    description: 'Move team issues through development and review.',
  },
  developer: {
    title: 'My issues',
    description: 'Work on your assigned issues and send finished work to review.',
  },
  qa: {
    title: 'Ready for QA',
    description: 'Pass an issue or send it back with a reason.',
  },
  guest: {
    title: 'Project overview',
    description: 'Check project issues and open the sprint board to edit scope or priority.',
  },
};

const statusLabels: Record<Task['column'], string> = {
  backlog: 'Backlog',
  in_progress: 'In progress',
  in_review: 'In review',
  completed: 'Done',
};

export const RoleDashboard: React.FC<RoleDashboardProps> = ({
  user,
  projects,
  activeProject,
  tasks,
  onNavigate,
  onOpenNewTask,
  onOpenNewProject,
  updateTaskColumn,
  rejectTask,
  approveTask,
}) => {
  const role = resolveRoleKey(user?.role);
  const copy = roleCopy[role];
  const [rejectingTaskId, setRejectingTaskId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [notice, setNotice] = useState('');

  const visibleTasks =
    role === 'developer'
      ? tasks.filter(
          (task) =>
            task.assigneeId === user?._id ||
              task.assignee?._id === user?._id ||
              task.assignee?.name?.toLowerCase() === user?.name?.toLowerCase()
        )
      : role === 'qa'
        ? tasks.filter((task) => task.column === 'in_review')
        : tasks;

  const counts = visibleTasks.reduce(
    (result, task) => {
      result[task.column] += 1;
      return result;
    },
    { backlog: 0, in_progress: 0, in_review: 0, completed: 0 }
  );

  const runAction = async (action: () => Promise<void>, successMessage: string) => {
    try {
      await action();
      setNotice(successMessage);
      return true;
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Could not update this issue.');
      return false;
    }
  };

  const handleShipOverride = (task: Task) => {
    if (!window.confirm('This issue has no QA pass. Ship anyway?')) return;
    void runAction(
      () => updateTaskColumn(task._id, 'completed', true),
      'Issue shipped with an admin override.'
    );
  };

  const handleReject = async (task: Task) => {
    if (!rejectReason.trim()) {
      setNotice('Add a reason before rejecting this issue.');
      return;
    }
    const succeeded = await runAction(
      () => rejectTask(task._id, rejectReason.trim(), 'Other'),
      'Issue returned to its owner.'
    );
    if (succeeded) {
      setRejectingTaskId(null);
      setRejectReason('');
    }
  };

  const emptyMessage =
    role === 'developer'
      ? 'No issues are assigned to you in this project.'
      : role === 'qa'
        ? 'No issues are waiting for QA.'
        : 'No issues in this project yet.';

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-4 rounded-lg border border-white/[0.08] bg-[#101318] p-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">{copy.title}</h2>
          <p className="mt-1 max-w-2xl text-sm text-neutral-400">{copy.description}</p>
          {activeProject && (
            <p className="mt-3 text-sm text-neutral-300">
              {activeProject.title}
              <span className="ml-2 font-mono text-xs text-neutral-500">
                {activeProject.key}
              </span>
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onNavigate('board')}
            className="rounded-md border border-white/[0.12] px-3 py-2 text-sm text-neutral-200 hover:bg-white/[0.05]"
          >
            Open sprint board
          </button>
          {role === 'admin' && (
            <button
              type="button"
              onClick={() => onNavigate('admin-audit')}
              className="rounded-md border border-white/[0.12] px-3 py-2 text-sm text-neutral-200 hover:bg-white/[0.05]"
            >
              View audit log
            </button>
          )}
          {role === 'guest' && (
            <button
              type="button"
              onClick={() => onNavigate('projects')}
              className="rounded-md border border-white/[0.12] px-3 py-2 text-sm text-neutral-200 hover:bg-white/[0.05]"
            >
              View projects
            </button>
          )}
          {role !== 'qa' && (
            <button
              type="button"
              onClick={role === 'guest' ? onOpenNewProject : onOpenNewTask}
              className="rounded-md bg-emerald-700 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-600"
            >
              {role === 'guest' ? 'New project' : 'New issue'}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {(Object.keys(statusLabels) as Task['column'][]).map((column) => (
          <div key={column} className="rounded-lg border border-white/[0.08] bg-[#101318] p-4">
            <p className="text-sm text-neutral-400">{statusLabels[column]}</p>
            <p className="mt-1 text-xl font-semibold text-white">{counts[column]}</p>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-lg border border-white/[0.08] bg-[#101318]">
        <div className="border-b border-white/[0.08] px-4 py-3">
          <h3 className="text-sm font-semibold text-white">Issues</h3>
        </div>
        {visibleTasks.length === 0 ? (
          <p className="px-4 py-8 text-sm text-neutral-400">{emptyMessage}</p>
        ) : (
          <ul className="divide-y divide-white/[0.07]">
            {visibleTasks.map((task) => (
              <li key={task._id} className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="font-medium text-neutral-100">{task.title}</p>
                  {task.description && (
                    <p className="mt-1 line-clamp-2 text-sm text-neutral-400">{task.description}</p>
                  )}
                  <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-neutral-500">
                    <span>{statusLabels[task.column]}</span>
                    <span>{task.priority} priority</span>
                    {task.assignee?.name && <span>Assigned to {task.assignee.name}</span>}
                  </div>
                  {role === 'qa' && rejectingTaskId === task._id && (
                    <div className="mt-3 flex max-w-xl flex-col gap-2 sm:flex-row">
                      <input
                        value={rejectReason}
                        onChange={(event) => setRejectReason(event.target.value)}
                        placeholder="Why should this issue go back?"
                        aria-label="Rejection reason"
                        className="min-w-0 flex-1 rounded-md border border-white/[0.12] bg-[#0b0d12] px-3 py-2 text-sm text-white placeholder:text-neutral-600 focus:border-emerald-700 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => void handleReject(task)}
                        className="rounded-md border border-white/[0.12] px-3 py-2 text-sm text-neutral-200 hover:bg-white/[0.05]"
                      >
                        Send back
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex flex-shrink-0 flex-wrap gap-2">
                  {role === 'developer' &&
                    (task.column === 'backlog' || task.column === 'in_progress') && (
                      <button
                        type="button"
                        onClick={() =>
                          void runAction(
                            () => updateTaskColumn(task._id, 'in_review'),
                            'Issue sent to QA.'
                          )
                        }
                        className="inline-flex items-center gap-1 rounded-md border border-white/[0.12] px-3 py-2 text-sm text-neutral-200 hover:bg-white/[0.05]"
                      >
                        Send to review <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    )}
                  {role === 'lead' && task.column === 'backlog' && (
                    <button
                      type="button"
                      onClick={() =>
                        void runAction(
                          () => updateTaskColumn(task._id, 'in_progress'),
                          'Issue moved to In progress.'
                        )
                      }
                      className="rounded-md border border-white/[0.12] px-3 py-2 text-sm text-neutral-200 hover:bg-white/[0.05]"
                    >
                      Start issue
                    </button>
                  )}
                  {role === 'lead' && task.column === 'in_progress' && (
                    <button
                      type="button"
                      onClick={() =>
                        void runAction(
                          () => updateTaskColumn(task._id, 'in_review'),
                          'Issue moved to In review.'
                        )
                      }
                      className="rounded-md border border-white/[0.12] px-3 py-2 text-sm text-neutral-200 hover:bg-white/[0.05]"
                    >
                      Send to review
                    </button>
                  )}
                  {role === 'qa' && task.column === 'in_review' && (
                    <>
                      <button
                        type="button"
                        onClick={() =>
                          void runAction(() => approveTask(task._id), 'Issue passed QA.')
                        }
                        className="inline-flex items-center gap-1 rounded-md bg-emerald-700 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-600"
                      >
                        <Check className="h-4 w-4" /> Pass
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setRejectingTaskId(task._id);
                          setRejectReason('');
                          setNotice('');
                        }}
                        className="inline-flex items-center gap-1 rounded-md border border-white/[0.12] px-3 py-2 text-sm text-neutral-200 hover:bg-white/[0.05]"
                      >
                        <X className="h-4 w-4" /> Reject
                      </button>
                    </>
                  )}
                  {role === 'admin' && task.column === 'in_review' && (
                    <button
                      type="button"
                      onClick={() => handleShipOverride(task)}
                      title="This issue has no QA pass. Ship anyway?"
                      className="rounded-md border border-white/[0.12] px-3 py-2 text-sm text-neutral-200 hover:bg-white/[0.05]"
                    >
                      Ship anyway
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {role === 'guest' && projects.length === 0 && (
        <button
          type="button"
          onClick={onOpenNewProject}
          className="text-sm text-neutral-300 underline underline-offset-4 hover:text-white"
        >
          Create the first project
        </button>
      )}
      {notice && (
        <p role="status" aria-live="polite" className="text-sm text-neutral-300">
          {notice}
        </p>
      )}
    </section>
  );
};

export default RoleDashboard;
