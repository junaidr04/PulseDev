import React, { useState, useEffect } from 'react';
import { RoleCockpitProps } from './AdminDashboard';
import {
  HeroConicFrame,
  RoleSurfaceCard,
  StaggerContainer,
  StaggerItem,
  FlowButton,
} from '../ui/RoleSharedUI';
import {
  Play,
  Pause,
  RotateCcw,
  GitBranch,
  Check,
  Copy,
  Send,
  AlertTriangle,
  CheckSquare,
  Square,
  Terminal,
  Plus,
  Flame,
} from 'lucide-react';

interface Subtask {
  id: string;
  text: string;
  done: boolean;
}

const INITIAL_SUBTASKS: Subtask[] = [
  {
    id: 'st-1',
    text: 'Define idempotency key schema in Redis cluster with 24h TTL',
    done: true,
  },
  {
    id: 'st-2',
    text: 'Implement exponential backoff jitter schedule (1s, 4s, 16s, 64s, dead-letter)',
    done: true,
  },
  {
    id: 'st-3',
    text: 'Add compound MongoDB index { projectId: 1, column: 1, priority: 1 }',
    done: false,
  },
  {
    id: 'st-4',
    text: 'Write integration tests for Stripe & Adyen webhook signature verification',
    done: false,
  },
];

// Deterministic 14-week x 4-row commit streak matrix for GitHub-style contribution strip
const CONTRIBUTION_CELLS = Array.from({ length: 56 }, (_, idx) => {
  const level = (idx * 7 + 3) % 5; // 0..4 intensity
  return level;
});

export const DeveloperDashboard: React.FC<RoleCockpitProps> = ({
  user,
  theme,
  tasks,
  activeProject,
  onNavigate,
  onOpenNewTask,
  updateTaskColumn,
}) => {
  // Keep the developer queue scoped to issues assigned to the authenticated user.
  const myTasks = tasks.filter(
    (t) =>
      t.assigneeId === user?._id ||
      t.assignee?.name?.toLowerCase() === (user?.name || 'marcus vance').toLowerCase()
  );
  const displayTasks = myTasks;

  const [selectedTaskIndex, setSelectedTaskIndex] = useState<number>(0);
  const [timerRunning, setTimerRunning] = useState<boolean>(true);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(5234); // 01:27:14
  const [subtasks, setSubtasks] = useState<Subtask[]>(() => {
    try {
      const saved = localStorage.getItem('pulsedev_dev_subtasks');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return INITIAL_SUBTASKS;
  });
  const [copiedBranch, setCopiedBranch] = useState<boolean>(false);
  const [submittedNotice, setSubmittedNotice] = useState<string | null>(null);
  const [blockerResolved, setBlockerResolved] = useState<boolean>(() => {
    return localStorage.getItem('pulsedev_dev_blocker_resolved') === 'true';
  });

  const focusTask = displayTasks[selectedTaskIndex] || displayTasks[0];
  const issueCode = `${activeProject?.key || 'PAY'}-${104 + selectedTaskIndex}`;
  const branchCmd = `git checkout -b feat/${issueCode.toLowerCase()}-webhook-backoff`;

  // Live deep-work focus stopwatch
  useEffect(() => {
    if (!timerRunning) return;
    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [timerRunning]);

  // Keyboard navigation: j / k to move through personal task list, Enter to focus
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.key === 'j') {
        e.preventDefault();
        setSelectedTaskIndex((prev) => Math.min(prev + 1, Math.max(0, displayTasks.length - 1)));
      } else if (e.key === 'k') {
        e.preventDefault();
        setSelectedTaskIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter' && displayTasks[selectedTaskIndex]) {
        e.preventDefault();
        setTimerRunning(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [displayTasks, selectedTaskIndex]);

  const formatTimer = (secs: number) => {
    const hrs = String(Math.floor(secs / 3600)).padStart(2, '0');
    const mins = String(Math.floor((secs % 3600) / 60)).padStart(2, '0');
    const s = String(secs % 60).padStart(2, '0');
    return `${hrs}:${mins}:${s}`;
  };

  const handleCopyBranch = () => {
    navigator.clipboard?.writeText(branchCmd);
    setCopiedBranch(true);
    setTimeout(() => setCopiedBranch(false), 2000);
  };

  const toggleSubtask = (id: string) => {
    setSubtasks((prev) => {
      const updated = prev.map((item) => (item.id === id ? { ...item, done: !item.done } : item));
      try {
        localStorage.setItem('pulsedev_dev_subtasks', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const handleSubmitForQa = async () => {
    if (!focusTask) return;
    try {
      await updateTaskColumn(focusTask._id, 'in_review');
      setSubmittedNotice(`${issueCode} submitted to Sophia Laurent's QA Queue`);
      setTimeout(() => setSubmittedNotice(null), 3500);
    } catch (error) {
      setSubmittedNotice(error instanceof Error ? error.message : 'Could not submit this issue to QA.');
      setTimeout(() => setSubmittedNotice(null), 3500);
    }
  };

  const completedSubtasks = subtasks.filter((s) => s.done).length;
  const subtaskPct = Math.round((completedSubtasks / subtasks.length) * 100);

  return (
    <StaggerContainer className="mx-auto max-w-4xl space-y-7 py-2">
      {/* HERO: Single-Column "Today's Focus" Deep-Work Card */}
      <StaggerItem>
        <HeroConicFrame theme={theme}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-white/[0.07] pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 font-mono text-xs text-cyan-400">
                <Terminal className="h-4 w-4" />
                <span>TODAY&apos;S FOCUS · DEEP WORK SESSION</span>
                <span>·</span>
                <span className="text-white font-bold">{issueCode}</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                {focusTask?.title ||
                  'No issue is currently assigned to you.'}
              </h2>
            </div>

            {/* Live Focus Stopwatch Controls */}
            <div className="flex items-center gap-2 rounded-xl border border-cyan-500/30 bg-[#080d14] px-3.5 py-2">
              <span
                className={`h-2 w-2 rounded-full ${
                  timerRunning ? 'bg-cyan-400 animate-ping' : 'bg-neutral-500'
                }`}
              />
              <span className="font-mono text-base font-bold text-white tabular-nums">
                {formatTimer(elapsedSeconds)}
              </span>
              <button
                onClick={() => setTimerRunning(!timerRunning)}
                className="ml-1 rounded-lg bg-cyan-400/20 border border-cyan-400/40 p-1.5 text-cyan-300 hover:bg-cyan-400/30 cursor-pointer"
                title={timerRunning ? 'Pause Focus Timer' : 'Start Focus Timer'}
                aria-label={timerRunning ? 'Pause Focus Timer' : 'Start Focus Timer'}
              >
                {timerRunning ? (
                  <Pause className="h-3.5 w-3.5" />
                ) : (
                  <Play className="h-3.5 w-3.5 fill-current" />
                )}
              </button>
              <button
                onClick={() => setElapsedSeconds(0)}
                className="rounded-lg p-1.5 text-neutral-400 hover:text-white cursor-pointer"
                title="Reset Timer"
                aria-label="Reset Timer"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Branch Name Copy Bar + Quick Submit for QA CTA */}
          <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-white/[0.07] bg-[#080b11] px-4 py-3">
            <div className="flex items-center gap-2.5 min-w-0 font-mono text-xs text-neutral-300">
              <GitBranch className="h-4 w-4 text-cyan-400 flex-shrink-0" />
              <code className="truncate text-cyan-200">{branchCmd}</code>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={handleCopyBranch}
                className="flex items-center gap-1.5 rounded-lg border border-white/[0.1] bg-[#121722] px-3 py-1.5 font-mono text-xs text-neutral-200 hover:border-cyan-400/40 hover:text-white cursor-pointer"
              >
                {copiedBranch ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                    <span className="text-emerald-300">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5 text-cyan-400" />
                    <span>Copy branch</span>
                  </>
                )}
              </button>

              <FlowButton
                text="Submit for QA"
                size="sm"
                variant="accent"
                accentColor="#22D3EE"
                onClick={handleSubmitForQa}
                disabled={!focusTask || focusTask.column === 'in_review' || focusTask.column === 'completed'}
              />
            </div>
          </div>

          {submittedNotice && (
            <div className="mt-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2 text-xs text-emerald-300 font-mono">
              ✓ {submittedNotice}
            </div>
          )}

          {/* Subtasks Execution Checklist */}
          <div className="mt-5 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-neutral-200">
                Implementation Subtasks ({completedSubtasks}/{subtasks.length})
              </span>
              <span className="font-mono text-cyan-400">{subtaskPct}% complete</span>
            </div>

            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
              <div
                className="h-full bg-gradient-to-r from-cyan-400 to-sky-400 transition-all duration-300"
                style={{ width: `${subtaskPct}%` }}
              />
            </div>

            <div className="space-y-2 pt-1">
              {subtasks.map((st) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => toggleSubtask(st.id)}
                  className={`flex w-full items-center gap-3 rounded-xl border px-3.5 py-2.5 text-left text-xs transition-colors cursor-pointer ${
                    st.done
                      ? 'border-white/[0.05] bg-[#090c12]/60 text-neutral-500 line-through'
                      : 'border-white/[0.08] bg-[#0b1018] text-neutral-100 hover:border-cyan-400/35'
                  }`}
                >
                  {st.done ? (
                    <CheckSquare className="h-4 w-4 text-cyan-400 flex-shrink-0" />
                  ) : (
                    <Square className="h-4 w-4 text-neutral-500 flex-shrink-0" />
                  )}
                  <span>{st.text}</span>
                </button>
              ))}
            </div>
          </div>
        </HeroConicFrame>
      </StaggerItem>

      {/* "Blocked By" Dependency Alert Banner */}
      <StaggerItem>
        <div
          className={`rounded-2xl border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
            blockerResolved
              ? 'border-emerald-500/25 bg-emerald-500/5'
              : 'border-amber-500/30 bg-amber-500/10'
          }`}
        >
          <div className="flex items-start sm:items-center gap-3">
            <AlertTriangle
              className={`h-4 w-4 flex-shrink-0 mt-0.5 sm:mt-0 ${
                blockerResolved ? 'text-emerald-400' : 'text-amber-400'
              }`}
            />
            <div className="text-xs">
              <span className="font-semibold text-white">
                {blockerResolved
                  ? 'Dependency Unblocked: Staging Redis Cluster Secret Rotated'
                  : 'Blocked By Alert: Waiting on RFC-045 JWK Staging Key from Alex Chen'}
              </span>
              <p className="text-neutral-400 mt-0.5">
                {blockerResolved
                  ? 'Mock JWK key verified in local .env — ready for full webhook replay.'
                  : 'Impacts PAY-104 staging webhook signature test suite.'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setBlockerResolved(!blockerResolved)}
            className="rounded-lg border border-white/[0.12] bg-[#121620] px-3 py-1.5 font-mono text-xs text-neutral-200 hover:text-white cursor-pointer flex-shrink-0"
          >
            {blockerResolved ? 'Re-flag Blocker' : 'Mark Unblocked'}
          </button>
        </div>
      </StaggerItem>

      {/* Personal Task Queue with Keyboard Navigation (j/k, Enter) */}
      <StaggerItem>
        <RoleSurfaceCard className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.06] pb-3">
            <div>
              <h3 className="text-sm font-semibold text-white">
                My Engineering Queue (Keyboard First)
              </h3>
              <p className="text-xs text-neutral-400 mt-0.5">
                Press <kbd className="rounded border border-white/15 bg-white/5 px-1.5 py-0.5 font-mono text-[10px] text-cyan-300">j</kbd> /{' '}
                <kbd className="rounded border border-white/15 bg-white/5 px-1.5 py-0.5 font-mono text-[10px] text-cyan-300">k</kbd> to navigate issues ·{' '}
                <kbd className="rounded border border-white/15 bg-white/5 px-1.5 py-0.5 font-mono text-[10px] text-cyan-300">Enter</kbd> to lock focus
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={onOpenNewTask}
                className="flex items-center gap-1.5 rounded-lg bg-cyan-400/15 border border-cyan-400/35 px-3 py-1.5 text-xs font-semibold text-cyan-200 hover:bg-cyan-400/25 cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>New Issue</span>
              </button>
              <button
                onClick={() => onNavigate('board')}
                className="text-xs font-mono text-neutral-400 hover:text-white cursor-pointer"
              >
                Full Board →
              </button>
            </div>
          </div>

          <div className="space-y-2">
            {displayTasks.map((t, idx) => {
              const isSelected = idx === selectedTaskIndex;
              const code = `${activeProject?.key || 'PAY'}-${104 + idx}`;
              return (
                <div
                  key={t._id}
                  onClick={() => setSelectedTaskIndex(idx)}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border px-4 py-3 transition-all cursor-pointer ${
                    isSelected
                      ? 'border-cyan-400/50 bg-cyan-500/10 shadow-[0_0_20px_rgba(34,211,238,0.1)]'
                      : 'border-white/[0.06] bg-[#0a0d14] hover:border-white/[0.14]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="font-mono text-xs font-semibold text-cyan-400">
                      {code}
                    </span>
                    <span className="text-sm font-medium text-white truncate">
                      {t.title}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0 font-mono text-xs">
                    <span className="text-neutral-400 capitalize">
                      {t.column.replace('_', ' ')}
                    </span>
                    {t.column !== 'in_review' && t.column !== 'completed' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          updateTaskColumn(t._id, 'in_review');
                        }}
                        className="rounded-md border border-cyan-400/35 bg-cyan-400/15 px-2.5 py-1 text-[11px] text-cyan-200 hover:bg-cyan-400/25 cursor-pointer"
                      >
                        Submit QA
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </RoleSurfaceCard>
      </StaggerItem>

      {/* GitHub-Style Contribution / Streak Strip */}
      <StaggerItem>
        <RoleSurfaceCard className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-white">
              <Flame className="h-4 w-4 text-cyan-400" />
              <span>Engineering Commit & PR Streak — 19 Consecutive Days</span>
            </div>
            <span className="font-mono text-xs text-cyan-300">
              148 commits in Cycle 44
            </span>
          </div>

          <div className="grid grid-cols-14 gap-1.5 pt-1">
            {CONTRIBUTION_CELLS.map((lvl, i) => {
              const bgClass =
                lvl === 0
                  ? 'bg-white/[0.05]'
                  : lvl === 1
                  ? 'bg-cyan-900/60'
                  : lvl === 2
                  ? 'bg-cyan-700/70'
                  : lvl === 3
                  ? 'bg-cyan-500/80'
                  : 'bg-cyan-300 shadow-[0_0_8px_rgba(34,211,238,0.5)]';
              return (
                <div
                  key={i}
                  className={`h-3.5 rounded-sm ${bgClass}`}
                  title={`${lvl * 3 + 1} commits`}
                />
              );
            })}
          </div>
        </RoleSurfaceCard>
      </StaggerItem>
    </StaggerContainer>
  );
};

export default DeveloperDashboard;
