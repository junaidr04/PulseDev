import React, { useState, useEffect } from 'react';
import { useProjects } from '../context/ProjectContext';
import { useAuth } from '../context/AuthContext';
import { X, Lock } from 'lucide-react';
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
    avatar: '',
  },
  {
    id: '66a1bf9823e4d5c6b7a89002',
    name: 'Priya Patel',
    role: 'lead',
    label: 'Priya Patel (Team lead)',
    avatar: '',
  },
  {
    id: '66a1bf9823e4d5c6b7a89004',
    name: 'Sophia Laurent',
    role: 'qa',
    label: 'Sophia Laurent (QA Automation Lead)',
    avatar: '',
  },
  {
    id: '66a1bf9823e4d5c6b7a89001',
    name: 'Alex Chen',
    role: 'admin',
    label: 'Alex Chen (Admin)',
    avatar: '',
  },
  {
    id: '66a1bf9823e4d5c6b7a89005',
    name: 'Jordan Blake',
    role: 'guest',
    label: 'Jordan Blake (Product Manager)',
    avatar: '',
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
            '',
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
    setTitle('Add password reset endpoint');
    setDescription('Send a reset link and reject expired reset tokens.');
    setPriority('high');
    setEstimateHours(6);
    setTags('Auth, API');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex min-h-full items-center justify-center overflow-y-auto bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        className="relative my-auto max-h-[calc(100dvh-2rem)] w-full max-w-lg overflow-y-auto rounded-lg border border-white/[0.12] bg-[#11151f] p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-white/[0.07] pb-3.5">
          <div>
            <h3 className="text-sm font-semibold text-white">New issue</h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              {canAssignToTeam
                ? 'Add work to the backlog or assign it to a teammate.'
                : 'The issue will be assigned to you.'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleAiAutofill}
              className="flex items-center gap-1.5 rounded-md border border-white/[0.08] bg-[#16181d] px-2.5 py-1 text-xs font-medium text-neutral-300 hover:text-white cursor-pointer"
            >
              <span>Use example</span>
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
              placeholder="What needs to be done?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-white/[0.08] bg-[#0e1014] px-3 py-2 text-white placeholder-neutral-500 focus:border-white/[0.2] focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-medium text-neutral-300">Description</label>
            <textarea
              rows={3}
              placeholder="Add context or acceptance notes (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-white/[0.08] bg-[#0e1014] px-3 py-2 text-white placeholder-neutral-500 focus:border-white/[0.2] focus:outline-none"
            />
          </div>

          {/* Leads and admins can assign issues to teammates. */}
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
            <label className="block font-medium text-neutral-300">Tags</label>
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
