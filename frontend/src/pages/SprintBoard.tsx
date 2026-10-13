import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useProjects, Task } from '../context/ProjectContext';
import { useAuth, User } from '../context/AuthContext';
import { getRoleTheme } from '../theme/roleTheme';
import {
  Plus,
  Search,
  MessageSquare,
  ArrowRight,
  Trash2,
  Check,
  Lock,
  X,
  Send,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  Sliders,
} from 'lucide-react';
import { FlowButton } from '../components/ui/FlowButton';


interface SprintBoardProps {
  onOpenNewTask: () => void;
}

const COLUMNS: {
  id: Task['column'];
  title: string;
  dotColor: string;
}[] = [
  { id: 'backlog', title: 'Backlog', dotColor: 'bg-neutral-500' },
  { id: 'in_progress', title: 'In Progress', dotColor: 'bg-cyan-400' },
  { id: 'in_review', title: 'In Review (QA)', dotColor: 'bg-amber-400' },
  { id: 'completed', title: 'Done', dotColor: 'bg-emerald-400' },
];

const TEAM_ASSIGNEES = [
  {
    _id: '66a1bf9823e4d5c6b7a89001',
    name: 'Alex Chen',
    role: 'admin',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=64&h=64&q=80',
  },
  {
    _id: '66a1bf9823e4d5c6b7a89002',
    name: 'Priya Patel',
    role: 'lead',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=64&h=64&q=80',
  },
  {
    _id: '66a1bf9823e4d5c6b7a89003',
    name: 'Marcus Vance',
    role: 'developer',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=64&h=64&q=80',
  },
  {
    _id: '66a1bf9823e4d5c6b7a89004',
    name: 'Sophia Laurent',
    role: 'qa',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=64&h=64&q=80',
  },
  {
    _id: '66a1bf9823e4d5c6b7a89005',
    name: 'Jordan Blake',
    role: 'guest',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=64&h=64&q=80',
  },
];

/**
 * Role-Specific Sprint Board Action & Ownership Evaluator:
 * - Admin ('admin'): Full control (move, reassign, delete anything).
 * - Backend Lead ('lead'): Approve/reassign in team and move across columns.
 * - Developer ('developer'): Move only own issues (Backlog -> In Progress -> In Review / Submit QA).
 * - QA ('qa'): Pass (-> Done) or Reject (-> In Progress) issues in QA review or assigned to Sophia.
 * - Product Manager ('guest'): Reprioritize & edit scope on any issue, move own issues.
 */
export function evaluateTaskControl(task: Task, user: User | null): {
  canControl: boolean;
  canReassign: boolean;
  canReprioritize: boolean;
  isMyTask: boolean;
  allowedColumns: Task['column'][];
  lockReason: string;
} {
  if (!user) {
    return {
      canControl: false,
      canReassign: false,
      canReprioritize: false,
      isMyTask: false,
      allowedColumns: [],
      lockReason: 'Sign in required to modify sprint issues.',
    };
  }

  const assigneeName = task.assignee?.name || 'Marcus Vance';
  const isMyTask =
    task.assigneeId === user._id ||
    task.assignee?._id === user._id ||
    assigneeName.toLowerCase() === user.name.toLowerCase();

  // 1. Admin (Alex Chen): Unrestricted control
  if (user.role === 'admin') {
    return {
      canControl: true,
      canReassign: true,
      canReprioritize: true,
      isMyTask,
      allowedColumns: ['backlog', 'in_progress', 'in_review', 'completed'],
      lockReason: 'Admin Full Control',
    };
  }

  // 2. Backend Lead (Priya Patel): Approve/reassign team issues & move across columns
  if (user.role === 'lead') {
    return {
      canControl: true,
      canReassign: true,
      canReprioritize: true,
      isMyTask,
      allowedColumns: ['backlog', 'in_progress', 'in_review', 'completed'],
      lockReason: 'Staff Lead Team Authority',
    };
  }

  // 3. Product Manager (Jordan Blake): Reprioritize & edit scope on any issue; move own issues
  if (user.role === 'guest') {
    if (isMyTask) {
      return {
        canControl: true,
        canReassign: false,
        canReprioritize: true,
        isMyTask: true,
        allowedColumns: ['backlog', 'in_progress', 'in_review', 'completed'],
        lockReason: 'Assigned to you (Product Manager)',
      };
    }
    return {
      canControl: false,
      canReassign: false,
      canReprioritize: true,
      isMyTask: false,
      allowedColumns: [],
      lockReason: `Assigned to ${assigneeName} — Product Managers can reprioritize scope, but engineering status transitions belong to ${assigneeName} or Lead/Admin.`,
    };
  }

  // 4. QA Lead (Sophia Laurent): Pass/Reject issues in 'in_review' or assigned to QA
  if (user.role === 'qa') {
    if (task.column === 'in_review' || isMyTask) {
      return {
        canControl: true,
        canReassign: false,
        canReprioritize: false,
        isMyTask,
        allowedColumns: ['in_progress', 'in_review', 'completed'],
        lockReason: 'QA Gate Verification',
      };
    }
    return {
      canControl: false,
      canReassign: false,
      canReprioritize: false,
      isMyTask: false,
      allowedColumns: [],
      lockReason: `Awaiting developer submission — QA Gate unlocks once ${assigneeName} moves this issue to "In Review (QA)".`,
    };
  }

  // 5. Developer (Marcus Vance): Only own issues + Submit for QA
  if (!isMyTask) {
    return {
      canControl: false,
      canReassign: false,
      canReprioritize: false,
      isMyTask: false,
      allowedColumns: [],
      lockReason: `Assigned to ${assigneeName} — Engineers can only move issues assigned to themselves.`,
    };
  }

  return {
    canControl: true,
    canReassign: false,
    canReprioritize: false,
    isMyTask: true,
    allowedColumns: ['backlog', 'in_progress', 'in_review'],
    lockReason: 'Assigned to you (Submit to QA when ready)',
  };
}

export const SprintBoard: React.FC<SprintBoardProps> = ({ onOpenNewTask }) => {
  const { user } = useAuth();
  const {
    activeProject,
    tasks,
    updateTaskColumn,
    updateTaskDetails,
    deleteTask,
    addComment,
    loading,
  } = useProjects();
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [onlyMyIssues, setOnlyMyIssues] = useState<boolean>(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [commentInput, setCommentInput] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<Task['column'] | null>(null);
  const [doneBurstTaskId, setDoneBurstTaskId] = useState<string | null>(null);

  const role = user?.role || 'guest';
  const roleTheme = getRoleTheme(role);
  const isAdmin = !!user && role === 'admin';
  const isLead = !!user && role === 'lead';
  const isQA = !!user && role === 'qa';
  const isPM = !!user && role === 'guest';

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3400);
  };

  const triggerDoneBurst = (taskId: string) => {
    setDoneBurstTaskId(taskId);
    setTimeout(() => {
      setDoneBurstTaskId((prev) => (prev === taskId ? null : prev));
    }, 1400);
  };

  const filteredTasks = (tasks || []).filter((task) => {
    const q = searchQuery.toLowerCase();
    const title = (task?.title || '').toLowerCase();
    const desc = (task?.description || '').toLowerCase();
    const tags = Array.isArray(task?.tags) ? task.tags : [];
    const matchesSearch =
      !q ||
      title.includes(q) ||
      desc.includes(q) ||
      tags.some((t) => String(t).toLowerCase().includes(q));
    const matchesPriority = priorityFilter === 'all' || task?.priority === priorityFilter;

    const assigneeName = task?.assignee?.name || '';
    const isMine =
      task?.assigneeId === user?._id ||
      task?.assignee?._id === user?._id ||
      (user?.name && assigneeName.toLowerCase() === user.name.toLowerCase());

    const matchesOwner = !onlyMyIssues || isMine;
    return matchesSearch && matchesPriority && matchesOwner;
  });

  const getNextColumn = (current: Task['column']): Task['column'] | null => {
    const order: Task['column'][] = ['backlog', 'in_progress', 'in_review', 'completed'];
    const idx = order.indexOf(current);
    return idx >= 0 && idx < order.length - 1 ? order[idx + 1] : null;
  };

  const handleMoveTask = async (task: Task, targetColumn: Task['column']) => {
    const perm = evaluateTaskControl(task, user);

    if (!perm.canControl) {
      showToast(perm.lockReason);
      return;
    }

    if (!perm.allowedColumns.includes(targetColumn)) {
      if (targetColumn === 'completed') {
        showToast('Role Gate: Only QA Lead, Backend Lead, or Admin can mark issues as Done.');
      } else {
        showToast(`Your role (${roleTheme.roleTitle}) cannot move this issue to ${targetColumn.replace('_', ' ')}.`);
      }
      return;
    }

    if (targetColumn === 'completed') {
      triggerDoneBurst(task._id);
    }

    await updateTaskColumn(task._id, targetColumn);
  };

  const handleReassignTask = async (task: Task, newAssigneeId: string) => {
    const found = TEAM_ASSIGNEES.find((a) => a._id === newAssigneeId);
    if (!found) return;
    await updateTaskDetails(task._id, {
      assigneeId: found._id,
      assignee: {
        _id: found._id,
        name: found.name,
        avatar: found.avatar,
        role: found.role,
      },
    });
    showToast(`Reassigned issue to ${found.name}`);
  };

  const handleReprioritizeTask = async (
    task: Task,
    newPriority: Task['priority']
  ) => {
    await updateTaskDetails(task._id, { priority: newPriority });
    showToast(`Updated priority to ${newPriority.toUpperCase()}`);
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim() || !liveSelectedTask || !user) return;
    await addComment(liveSelectedTask._id, commentInput.trim());
    setCommentInput('');
  };

  const getPriorityBadge = (priority: Task['priority']) => {
    switch (priority) {
      case 'critical':
        return { label: 'Urgent', color: 'text-rose-400' };
      case 'high':
        return { label: 'High', color: 'text-amber-400' };
      case 'medium':
        return { label: 'Medium', color: 'text-cyan-400' };
      default:
        return { label: 'Low', color: 'text-neutral-500' };
    }
  };

  const liveSelectedTask = selectedTask
    ? tasks.find((t) => t._id === selectedTask._id) || selectedTask
    : null;

  const selectedTaskPerm = liveSelectedTask ? evaluateTaskControl(liveSelectedTask, user) : null;

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#0b0c0e] relative">
      {/* Floating Permission / Action Notice Toast */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.95 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-xl border border-amber-500/35 bg-[#16181d] px-4 py-2.5 text-xs text-amber-200 shadow-2xl"
          >
            <Lock className="h-3.5 w-3.5 text-amber-400 flex-shrink-0" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Board Header & Role Scope Bar */}
      <div className="border-b border-white/[0.07] px-6 py-4 space-y-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span
                className="font-mono text-xs font-bold"
                style={{ color: roleTheme.accentHex }}
              >
                {activeProject?.key || 'PAY'}
              </span>
              <h1 className="text-base font-semibold text-white tracking-tight">
                {activeProject?.title || 'Global Checkout & Payment Engine v2'}
              </h1>
            </div>
            <p className="text-xs text-neutral-500 mt-0.5">
              {activeProject?.description}
            </p>
          </div>

          {/* Filter & Action Controls */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-neutral-500" />
              <input
                type="text"
                placeholder="Filter issues..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 rounded-lg border border-white/[0.08] bg-[#131519] pl-8 pr-3 text-xs text-neutral-200 placeholder-neutral-500 focus:border-white/[0.2] focus:outline-none w-44 sm:w-52"
              />
            </div>

            <button
              onClick={() => setOnlyMyIssues(!onlyMyIssues)}
              className={`h-8 rounded-lg border px-2.5 text-xs font-medium cursor-pointer ${
                onlyMyIssues
                  ? 'border-white/[0.2] bg-white/[0.08] text-white'
                  : 'border-white/[0.08] bg-[#131519] text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Assigned to me
            </button>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="h-8 rounded-lg border border-white/[0.08] bg-[#131519] px-2.5 text-xs text-neutral-300 focus:outline-none cursor-pointer"
            >
              <option value="all">All priorities</option>
              <option value="critical">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>

            {user && (
              <FlowButton
                text="New issue"
                size="sm"
                variant="accent"
                accentColor={roleTheme.accentHex}
                onClick={onOpenNewTask}
              />
            )}
          </div>
        </div>

        {/* Role-Specific Board Capability Banner */}
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/[0.06] bg-[#111317] px-3.5 py-2 text-xs">
          <div className="flex items-center gap-2 text-neutral-300">
            <ShieldCheck
              className="h-3.5 w-3.5 flex-shrink-0"
              style={{ color: roleTheme.accentHex }}
            />
            <span>
              <strong className="text-white">
                {user?.name} ({roleTheme.roleTitle}):
              </strong>{' '}
              {isAdmin &&
                'Full Architect Authority — Drag or move any issue, reassign owners, or delete tasks.'}
              {isLead &&
                'Backend Lead Authority — Approve PRs, reassign team members, and ship issues across all columns.'}
              {role === 'developer' &&
                'Developer Focus — Move your own assigned issues and click "Submit QA" when ready for Sophia.'}
              {isQA &&
                'Quality Gate Authority — Click "Pass" or "Reject" on issues in QA Review to stamp release status.'}
              {isPM &&
                'Product Manager Studio — Reprioritize any issue, adjust sprint scope, and log new stories.'}
            </span>
          </div>
          <span className="font-mono text-[11px] text-neutral-400">
            Tip: Drag cards between columns or click a card for details
          </span>
        </div>
      </div>

      {/* Kanban Columns with Drag-and-Drop & Spring Physics */}
      <div className="flex-1 overflow-x-auto p-6 pb-24">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 h-full">
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className="rounded-xl border border-white/[0.05] bg-[#101216] p-4 animate-pulse h-96"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 min-w-[920px] h-full">
            {COLUMNS.map((col) => {
              const colTasks = filteredTasks.filter((t) => t.column === col.id);
              const isDropTarget = dragOverCol === col.id;

              return (
                <div
                  key={col.id}
                  onDragOver={(e) => {
                    e.preventDefault();
                    if (dragOverCol !== col.id) setDragOverCol(col.id);
                  }}
                  onDragLeave={() => {
                    if (dragOverCol === col.id) setDragOverCol(null);
                  }}
                  onDrop={async (e) => {
                    e.preventDefault();
                    setDragOverCol(null);
                    if (!draggedTaskId) return;
                    const draggedTask = tasks.find((t) => t._id === draggedTaskId);
                    setDraggedTaskId(null);
                    if (draggedTask && draggedTask.column !== col.id) {
                      await handleMoveTask(draggedTask, col.id);
                    }
                  }}
                  className={`flex flex-col rounded-xl bg-[#0e1014] border transition-colors overflow-hidden ${
                    isDropTarget
                      ? 'border-white/30 bg-[#131722]'
                      : 'border-white/[0.06]'
                  }`}
                >
                  {/* Column Header */}
                  <div className="flex items-center justify-between px-3.5 py-3 border-b border-white/[0.05]">
                    <div className="flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${col.dotColor}`} />
                      <h3 className="text-xs font-medium text-neutral-200">
                        {col.title}
                      </h3>
                      <span className="text-xs text-neutral-500 font-mono tabular-nums">
                        {colTasks.length}
                      </span>
                    </div>
                  </div>

                  {/* Cards List */}
                  <div className="flex-1 overflow-y-auto p-2.5 space-y-2.5">
                    {colTasks.length === 0 ? (
                      <div className="flex h-36 items-center justify-center rounded-lg border border-dashed border-white/[0.05] text-xs text-neutral-600">
                        Drop issue here
                      </div>
                    ) : (
                      colTasks.map((task, idx) => {
                        const nextCol = getNextColumn(task.column);
                        const prio = getPriorityBadge(task.priority);
                        const globalIdx = tasks.findIndex((t) => t._id === task._id);
                        const issueCode = `${activeProject?.key || 'PAY'}-${101 + (globalIdx >= 0 ? globalIdx : idx)}`;
                        const assigneeName = task.assignee?.name || 'Marcus Vance';
                        const assigneeAvatar =
                          task.assignee?.avatar ||
                          'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=64&h=64&q=80';

                        const perm = evaluateTaskControl(task, user);
                        const showBurst = doneBurstTaskId === task._id;

                        return (
                          <motion.div
                            layout
                            transition={{
                              type: 'spring',
                              stiffness: 420,
                              damping: 30,
                            }}
                            key={task._id}
                            draggable={perm.canControl}
                            onDragStart={() => setDraggedTaskId(task._id)}
                            onDragEnd={() => {
                              setDraggedTaskId(null);
                              setDragOverCol(null);
                            }}
                            onClick={() => setSelectedTask(task)}
                            className={`group relative rounded-lg border p-3.5 transition-colors cursor-pointer shadow-sm ${
                              perm.canControl
                                ? 'border-white/[0.09] bg-[#13151a] hover:border-white/[0.2] hover:bg-[#161920]'
                                : 'border-white/[0.05] bg-[#101216]/80 hover:border-white/[0.12]'
                            }`}
                          >
                            {/* Confetti / Check-Burst Overlay when moved to Done */}
                            <AnimatePresence>
                              {showBurst && (
                                <motion.div
                                  initial={{ opacity: 0, scale: 0.6 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  exit={{ opacity: 0, scale: 1.15 }}
                                  className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center rounded-lg bg-emerald-500/20 backdrop-blur-[2px]"
                                >
                                  <div className="flex items-center gap-1.5 rounded-full border border-emerald-400/60 bg-[#090d14] px-3 py-1 text-xs font-mono font-bold text-emerald-300 shadow-lg">
                                    <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
                                    <span>SHIPPED TO DONE!</span>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>

                            {/* Top Meta Row: Issue ID + Priority (or PM Priority Selector) + Role Status */}
                            <div className="flex items-center justify-between gap-2 mb-1.5">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-[11px] text-neutral-400">
                                  {issueCode}
                                </span>
                                {isPM ? (
                                  <select
                                    value={task.priority}
                                    onClick={(e) => e.stopPropagation()}
                                    onChange={(e) =>
                                      handleReprioritizeTask(
                                        task,
                                        e.target.value as Task['priority']
                                      )
                                    }
                                    className={`rounded border border-rose-400/30 bg-[#0b0e14] px-1.5 py-0.5 text-[10px] font-semibold ${prio.color} focus:outline-none cursor-pointer`}
                                    title="Product Manager: Reprioritize issue"
                                  >
                                    <option value="critical">Urgent</option>
                                    <option value="high">High</option>
                                    <option value="medium">Medium</option>
                                    <option value="low">Low</option>
                                  </select>
                                ) : (
                                  <span className={`text-[11px] font-medium ${prio.color}`}>
                                    {prio.label}
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-1.5">
                                {!perm.canControl ? (
                                  /* Clear Tooltip Explaining Why It's Locked */
                                  <div
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      showToast(perm.lockReason);
                                    }}
                                    className="group/lock relative flex items-center gap-1 text-[10px] text-neutral-400 hover:text-amber-300"
                                  >
                                    <Lock className="h-3 w-3 text-amber-400/80" />
                                    <span>{assigneeName.split(' ')[0]}&apos;s scope</span>
                                    <div className="pointer-events-none invisible group-hover/lock:visible opacity-0 group-hover/lock:opacity-100 transition-opacity absolute right-0 top-full mt-1.5 z-30 w-56 rounded-lg border border-amber-400/30 bg-[#0b0e15] p-2 text-[10px] leading-relaxed text-neutral-200 shadow-2xl">
                                      {perm.lockReason}
                                    </div>
                                  </div>
                                ) : (
                                  <span
                                    className="text-[10px] font-mono"
                                    style={{ color: roleTheme.accentHex }}
                                  >
                                    {isAdmin
                                      ? 'Admin'
                                      : isLead
                                      ? 'Team Lead'
                                      : perm.isMyTask
                                      ? 'Your issue'
                                      : 'QA Gate'}
                                  </span>
                                )}

                                {/* Admin can delete tasks */}
                                {isAdmin && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      deleteTask(task._id);
                                    }}
                                    className="opacity-0 group-hover:opacity-100 text-neutral-500 hover:text-rose-400 transition-opacity p-0.5 cursor-pointer"
                                    title="Delete issue (Admin only)"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Title */}
                            <h4 className="text-[13px] font-medium text-neutral-100 leading-snug group-hover:text-white">
                              {task.title}
                            </h4>

                            {/* Description excerpt */}
                            <p className="mt-1 text-xs text-neutral-500 line-clamp-2 leading-relaxed">
                              {task.description}
                            </p>

                            {/* Footer with Role-Tailored Quick Actions */}
                            <div className="mt-3 pt-2.5 border-t border-white/[0.05] flex items-center justify-between gap-2">
                              <div
                                className="flex items-center gap-2 min-w-0"
                                onClick={(e) => {
                                  if (perm.canReassign) e.stopPropagation();
                                }}
                              >
                                <img
                                  src={assigneeAvatar}
                                  alt={assigneeName}
                                  className="h-4.5 w-4.5 rounded-full object-cover flex-shrink-0"
                                />
                                {perm.canReassign ? (
                                  <select
                                    value={task.assignee?._id || task.assigneeId}
                                    onChange={(e) =>
                                      handleReassignTask(task, e.target.value)
                                    }
                                    className="bg-transparent text-[11px] text-neutral-300 hover:text-white focus:outline-none cursor-pointer truncate max-w-[115px]"
                                    title="Reassign owner (Admin / Lead)"
                                  >
                                    {TEAM_ASSIGNEES.map((m) => (
                                      <option
                                        key={m._id}
                                        value={m._id}
                                        className="bg-[#11141c] text-white"
                                      >
                                        {m.name}
                                      </option>
                                    ))}
                                  </select>
                                ) : (
                                  <span className="text-[11px] text-neutral-400 truncate max-w-[100px]">
                                    {assigneeName}
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-1.5 text-neutral-500 flex-shrink-0">
                                <div className="flex items-center gap-1 text-[11px] font-mono mr-1">
                                  <MessageSquare className="h-3 w-3" />
                                  <span>{task.comments?.length || 0}</span>
                                </div>

                                {/* Role-Specific Card Action Buttons */}
                                {isQA && task.column === 'in_review' ? (
                                  <div className="flex items-center gap-1">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleMoveTask(task, 'completed');
                                      }}
                                      className="flex items-center gap-1 rounded bg-emerald-500/20 border border-emerald-500/40 px-2 py-0.5 text-[10px] font-semibold text-emerald-300 hover:bg-emerald-500/30 cursor-pointer"
                                    >
                                      <Check className="h-2.5 w-2.5" />
                                      <span>Pass</span>
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleMoveTask(task, 'in_progress');
                                      }}
                                      className="flex items-center gap-1 rounded bg-rose-500/15 border border-rose-500/35 px-2 py-0.5 text-[10px] font-semibold text-rose-300 hover:bg-rose-500/25 cursor-pointer"
                                    >
                                      <RotateCcw className="h-2.5 w-2.5" />
                                      <span>Reject</span>
                                    </button>
                                  </div>
                                ) : role === 'developer' &&
                                  perm.canControl &&
                                  task.column !== 'in_review' &&
                                  task.column !== 'completed' ? (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleMoveTask(task, 'in_review');
                                    }}
                                    className="flex items-center gap-1 rounded bg-cyan-400/15 border border-cyan-400/35 px-2 py-0.5 text-[10px] font-semibold text-cyan-200 hover:bg-cyan-400/25 cursor-pointer"
                                  >
                                    <span>Submit QA</span>
                                    <ArrowRight className="h-2.5 w-2.5" />
                                  </button>
                                ) : perm.canControl &&
                                  nextCol &&
                                  perm.allowedColumns.includes(nextCol) ? (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleMoveTask(task, nextCol);
                                    }}
                                    className="flex items-center gap-1 rounded bg-white/[0.08] px-2 py-0.5 text-[11px] font-medium text-neutral-100 hover:bg-white hover:text-[#0b0c0e] transition-colors cursor-pointer"
                                    title={`Move to ${nextCol.replace('_', ' ')}`}
                                  >
                                    {nextCol === 'completed' ? (
                                      <>
                                        <Check className="h-3 w-3 text-emerald-400" />
                                        <span>Ship</span>
                                      </>
                                    ) : (
                                      <ArrowRight className="h-3 w-3" />
                                    )}
                                  </button>
                                ) : null}
                              </div>
                            </div>
                          </motion.div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Issue Detail Modal */}
      {liveSelectedTask && selectedTaskPerm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-sm p-4"
          onClick={() => setSelectedTask(null)}
        >
          <div
            className="w-full max-w-xl rounded-xl border border-white/[0.1] bg-[#111317] p-6 shadow-2xl space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-white/[0.07] pb-4">
              <div>
                <div className="flex items-center gap-2 text-xs text-neutral-400 mb-1">
                  <span className="font-mono">{activeProject?.key || 'PAY'}</span>
                  <span>·</span>
                  <span>
                    Assigned to{' '}
                    <strong className="text-white">
                      {liveSelectedTask.assignee?.name || 'Marcus Vance'}
                    </strong>
                  </span>
                </div>
                <h2 className="text-base font-semibold text-white">
                  {liveSelectedTask.title}
                </h2>
              </div>
              <button
                onClick={() => setSelectedTask(null)}
                className="text-neutral-500 hover:text-white p-1 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-neutral-300 leading-relaxed">
              {liveSelectedTask.description}
            </p>

            {/* PM Scope & Priority Controls inside Detail Modal */}
            {selectedTaskPerm.canReprioritize && (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/[0.07] bg-[#0d1017] px-3.5 py-2.5 text-xs">
                <div className="flex items-center gap-2 text-neutral-300">
                  <Sliders className="h-3.5 w-3.5" style={{ color: roleTheme.accentHex }} />
                  <span>Priority & Scope Control:</span>
                </div>
                <div className="flex items-center gap-2">
                  {(['critical', 'high', 'medium', 'low'] as Task['priority'][]).map(
                    (p) => (
                      <button
                        key={p}
                        onClick={() => handleReprioritizeTask(liveSelectedTask, p)}
                        className={`rounded px-2 py-1 text-[11px] font-mono uppercase cursor-pointer ${
                          liveSelectedTask.priority === p
                            ? 'bg-white text-[#090b10] font-bold'
                            : 'bg-white/[0.05] text-neutral-400 hover:text-white'
                        }`}
                      >
                        {p === 'critical' ? 'Urgent' : p}
                      </button>
                    )
                  )}
                </div>
              </div>
            )}

            {/* Ownership & Status Control Section */}
            {selectedTaskPerm.canControl ? (
              <div className="space-y-2 pt-1">
                <div className="text-[11px] font-medium text-neutral-400">
                  Transition Issue Status ({roleTheme.roleTitle}):
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  {COLUMNS.map((c) => {
                    const isCurrent = liveSelectedTask.column === c.id;
                    const isAllowed = selectedTaskPerm.allowedColumns.includes(c.id);
                    return (
                      <button
                        key={c.id}
                        disabled={!isAllowed}
                        onClick={() => handleMoveTask(liveSelectedTask, c.id)}
                        className={`rounded-lg px-2.5 py-1 text-xs font-medium cursor-pointer ${
                          isCurrent
                            ? 'bg-white text-[#0b0c0e]'
                            : !isAllowed
                            ? 'border border-white/[0.04] text-neutral-600 cursor-not-allowed'
                            : 'border border-white/[0.08] bg-[#16181d] text-neutral-300 hover:text-white'
                        }`}
                      >
                        {c.title}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2.5 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-amber-200/90">
                <Lock className="h-4 w-4 text-amber-400 flex-shrink-0" />
                <span>{selectedTaskPerm.lockReason}</span>
              </div>
            )}

            {/* Comments Thread */}
            <div className="border-t border-white/[0.07] pt-4 space-y-3">
              <div className="text-xs font-medium text-neutral-400">
                Discussion ({liveSelectedTask.comments?.length || 0})
              </div>

              <div className="max-h-44 overflow-y-auto space-y-2.5">
                {!liveSelectedTask.comments || liveSelectedTask.comments.length === 0 ? (
                  <div className="text-xs text-neutral-600 py-2">No comments yet.</div>
                ) : (
                  liveSelectedTask.comments.map((c) => (
                    <div
                      key={c.id}
                      className="rounded-lg bg-[#16181d] p-3 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-neutral-200">{c.userName}</span>
                        <span className="text-[10px] text-neutral-500">
                          {new Date(c.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <p className="text-neutral-300">{c.text}</p>
                    </div>
                  ))
                )}
              </div>

              {user && (
                <form onSubmit={handleAddComment} className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    value={commentInput}
                    onChange={(e) => setCommentInput(e.target.value)}
                    placeholder="Leave a comment..."
                    className="flex-1 rounded-lg border border-white/[0.08] bg-[#0e1014] px-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:border-white/[0.2] focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={!commentInput.trim()}
                    className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-[#0b0c0e] hover:bg-neutral-200 disabled:opacity-40 cursor-pointer flex items-center gap-1"
                  >
                    <Send className="h-3 w-3" />
                    <span>Comment</span>
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SprintBoard;
