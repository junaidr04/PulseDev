import React, { useState, useEffect } from 'react';
import { useProjects } from '../context/ProjectContext';
import { useAuth } from '../context/AuthContext';
import { X, Sparkles, Lock } from 'lucide-react';
import { FlowButton } from './ui/FlowButton';


interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ASSIGNEE_OPTIONS = [
  {
    id: '66a1bf9823e4d5c6b7a89003',
    name: 'Marcus Vance',
    role: 'developer',
    label: 'Marcus Vance (Senior Engineer)',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=64&h=64&q=80',
  },
  {
    id: '66a1bf9823e4d5c6b7a89002',
    name: 'Priya Patel',
    role: 'lead',
    label: 'Priya Patel (Staff Backend Lead)',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=64&h=64&q=80',
  },
  {
    id: '66a1bf9823e4d5c6b7a89004',
    name: 'Sophia Laurent',
    role: 'qa',
    label: 'Sophia Laurent (QA Automation Lead)',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=64&h=64&q=80',
  },
  {
    id: '66a1bf9823e4d5c6b7a89001',
    name: 'Alex Chen',
    role: 'admin',
    label: 'Alex Chen (Principal Architect)',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=64&h=64&q=80',
  },
  {
    id: '66a1bf9823e4d5c6b7a89005',
    name: 'Jordan Blake',
    role: 'guest',
    label: 'Jordan Blake (Product Manager)',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=64&h=64&q=80',
  },
];

export const CreateTaskModal: React.FC<CreateTaskModalProps> = ({ isOpen, onClose }) => {
  const { createTask } = useProjects();
  const { user } = useAuth();
  const canAssignToTeam = user?.role === 'admin' || user?.role === 'lead';
  const canChooseInitialStatus = user?.role === 'admin';

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [column, setColumn] = useState('backlog');
  const [priority, setPriority] = useState('high');
  const [estimateHours, setEstimateHours] = useState(6);
  const [assigneeId, setAssigneeId] = useState(user?._id || '66a1bf9823e4d5c6b7a89001');
  const [tags, setTags] = useState('');
  const [isAiAutofilling, setIsAiAutofilling] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (user?._id) {
      setAssigneeId(user._id);
    }
  }, [user?._id, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    setErrorMsg(null);

    if (
      canChooseInitialStatus &&
      column === 'completed' &&
      !window.confirm('This issue has no QA pass. Ship anyway?')
    ) {
      setLoading(false);
      return;
    }

    const selectedMember = canAssignToTeam
      ? ASSIGNEE_OPTIONS.find((m) => m.id === assigneeId || m.name === user?.name) || ASSIGNEE_OPTIONS[0]
      : {
          id: user?._id || '3',
          name: user?.name || 'Marcus Vance',
          role: user?.role || 'developer',
          avatar:
            user?.avatar ||
            'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=64&h=64&q=80',
        };

    try {
      await createTask({
        title: title.trim(),
        description: description.trim(),
        column: canChooseInitialStatus ? column : 'backlog',
        ...(canChooseInitialStatus && column === 'completed' ? { overrideQa: true } : {}),
        priority,
        assigneeId: selectedMember.id,
        assignee: {
          _id: selectedMember.id,
          name: selectedMember.name,
          avatar: selectedMember.avatar,
          role: selectedMember.role,
        },
        estimateHours: Number(estimateHours) || 4,
        tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
      });
      setTitle('');
      setDescription('');
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Could not create issue.');
    } finally {
      setLoading(false);
    }
  };

  const handleAiAutofill = () => {
    setIsAiAutofilling(true);
    setTimeout(() => {
      setTitle('Optimize Compound Index on Tasks Collection { projectId: 1, column: 1 }');
      setDescription('Verify query execution plans to ensure zero full collection scans on the Kanban pipeline.');
      setPriority('critical');
      setEstimateHours(8);
      setTags('Database, Index, Performance');
      setIsAiAutofilling(false);
    }, 250);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex min-h-full items-center justify-center overflow-y-auto bg-black/70 backdrop-blur-md p-4"
      onClick={onClose}
    >
      <div
        className="relative my-auto max-h-[calc(100dvh-2rem)] w-full max-w-lg overflow-y-auto rounded-2xl border border-white/[0.12] bg-[#11151f] p-6 shadow-[0_24px_64px_rgba(0,0,0,0.85),0_0_40px_rgba(16,185,129,0.12)] animate-modal-pop"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400" />
        <div className="flex items-center justify-between border-b border-white/[0.07] pb-3.5">
          <div>
            <h3 className="text-sm font-semibold text-white">New Issue</h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              {canAssignToTeam
                ? `${user?.role === 'admin' ? 'Admin' : 'Lead'} Mode: Assign issue to a team member`
                : `Scoped Mode: Issue will be assigned to you (${user?.name})`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleAiAutofill}
              disabled={isAiAutofilling}
              className="flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-[#16181d] px-2.5 py-1 text-xs font-medium text-neutral-300 hover:text-white cursor-pointer"
            >
              <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
              <span>{isAiAutofilling ? 'Drafting...' : 'Autofill template'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="text-neutral-500 hover:text-white p-1 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
          {errorMsg && (
            <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-2.5 text-rose-300">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="block font-medium text-neutral-300">Title</label>
            <input
              type="text"
              required
              placeholder="Issue summary..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-white/[0.08] bg-[#0e1014] px-3 py-2 text-white placeholder-neutral-500 focus:border-white/[0.2] focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-medium text-neutral-300">Description</label>
            <textarea
              rows={3}
              placeholder="Context, implementation details, or acceptance criteria..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-white/[0.08] bg-[#0e1014] px-3 py-2 text-white placeholder-neutral-500 focus:border-white/[0.2] focus:outline-none"
            />
          </div>

          {/* Assignee Control: Admin can assign to anyone; Engineers are locked to themselves */}
          <div>
            <label className="block font-medium text-neutral-300">Assignee</label>
            {canAssignToTeam ? (
              <select
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-white/[0.08] bg-[#0e1014] px-2.5 py-2 text-white focus:outline-none"
              >
                {ASSIGNEE_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
              </select>
            ) : (
              <div className="mt-1.5 flex items-center justify-between rounded-lg border border-white/[0.06] bg-[#0e1014]/70 px-3 py-2 text-neutral-400">
                <span>{user?.name} ({user?.role})</span>
                <span className="flex items-center gap-1 text-[11px] text-neutral-500">
                  <Lock className="h-3 w-3" />
                  <span>Self-assigned only</span>
                </span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-medium text-neutral-300">Status</label>
              <select
                value={canChooseInitialStatus ? column : 'backlog'}
                disabled={!canChooseInitialStatus}
                onChange={(e) => setColumn(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-white/[0.08] bg-[#0e1014] px-2.5 py-2 text-white disabled:opacity-60 focus:outline-none"
              >
                <option value="backlog">Backlog</option>
                {canChooseInitialStatus && (
                  <>
                    <option value="in_progress">In Progress</option>
                    <option value="in_review">In Review</option>
                    <option value="completed">Done</option>
                  </>
                )}
              </select>
            </div>

            <div>
              <label className="block font-medium text-neutral-300">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-white/[0.08] bg-[#0e1014] px-2.5 py-2 text-white focus:outline-none"
              >
                <option value="critical">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-neutral-300">Estimate (h)</label>
              <input
                type="number"
                min={1}
                max={80}
                value={estimateHours}
                onChange={(e) => setEstimateHours(Number(e.target.value))}
                className="mt-1.5 w-full rounded-lg border border-white/[0.08] bg-[#0e1014] px-3 py-2 text-white focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-neutral-300">Labels (comma-separated)</label>
            <input
              type="text"
              placeholder="Redis, Auth, API"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-white/[0.08] bg-[#0e1014] px-3 py-2 text-white placeholder-neutral-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-white/[0.07]">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-3.5 py-1.5 font-medium text-neutral-400 hover:text-white cursor-pointer"
            >
              Cancel
            </button>
            <FlowButton
              type="submit"
              disabled={loading}
              size="sm"
              variant="primary"
              text={loading ? 'Saving...' : 'Create issue'}
            />
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTaskModal;
