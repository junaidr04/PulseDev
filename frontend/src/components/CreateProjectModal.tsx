import React, { useState } from 'react';
import { useProjects } from '../context/ProjectContext';
import { X } from 'lucide-react';
import { FlowButton } from './ui/FlowButton';


interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({ isOpen, onClose }) => {
  const { createProject } = useProjects();
  const [title, setTitle] = useState('');
  const [key, setKey] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<string>('Fullstack Platform');
  const [tags, setTags] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !key.trim() || !description.trim()) return;

    setLoading(true);
    setErrorMsg(null);
    try {
      await createProject({
        title: title.trim(),
        key: key.toUpperCase().trim(),
        description: description.trim(),
        category,
        tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
      });
      setTitle('');
      setKey('');
      setDescription('');
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Could not create initiative.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex min-h-full items-center justify-center overflow-y-auto bg-black/70 backdrop-blur-md p-3 sm:p-4"
      onClick={onClose}
    >
      <div
        className="relative my-auto flex max-h-[calc(100dvh-1.5rem)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-white/[0.12] bg-[#11151f] p-4 shadow-[0_24px_64px_rgba(0,0,0,0.85),0_0_40px_rgba(16,185,129,0.12)] animate-modal-pop sm:max-h-[calc(100dvh-2rem)] sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400" />
        <div className="sticky top-0 flex shrink-0 items-center justify-between gap-3 border-b border-white/[0.07] bg-[#11151f] pb-3.5">
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-white">New Initiative</h3>
            <p className="text-xs text-neutral-500 mt-0.5">Create a new engineering workspace initiative</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex min-h-10 min-w-10 shrink-0 items-center justify-center rounded-lg text-neutral-500 hover:bg-white/[0.06] hover:text-white"
            aria-label="Close dialog"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="min-h-0 overflow-y-auto mt-4 space-y-4 text-sm">
          {errorMsg && (
            <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-2.5 text-rose-300">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="block font-medium text-neutral-300">Initiative Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Distributed Rate Limiter v2"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (!key) {
                  const words = e.target.value.split(' ').filter(Boolean);
                  setKey(words.map((w) => w[0]).join('').substring(0, 5).toUpperCase());
                }
              }}
              className="mt-1.5 min-h-11 w-full rounded-lg border border-white/[0.08] bg-[#0e1014] px-3 py-2 text-white placeholder-neutral-500 focus:border-white/[0.2] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="block font-medium text-neutral-300">Key</label>
              <input
                type="text"
                required
                maxLength={8}
                placeholder="RATE"
                value={key}
                onChange={(e) => setKey(e.target.value.toUpperCase())}
                className="mt-1.5 min-h-11 w-full rounded-lg border border-white/[0.08] bg-[#0e1014] px-3 py-2 font-mono text-white placeholder-neutral-500 focus:outline-none uppercase"
              />
            </div>

            <div>
              <label className="block font-medium text-neutral-300">Area</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="mt-1.5 min-h-11 w-full rounded-lg border border-white/[0.08] bg-[#0e1014] px-2.5 py-2 text-white focus:outline-none"
              >
                <option value="Backend Architecture">Backend Architecture</option>
                <option value="Security & Auth">Security & Auth</option>
                <option value="DevOps & Cloud">DevOps & Cloud</option>
                <option value="Fullstack Platform">Fullstack Platform</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-medium text-neutral-300">Summary</label>
            <textarea
              rows={3}
              required
              placeholder="Scope, goals, and key deliverables..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1.5 min-h-24 w-full rounded-lg border border-white/[0.08] bg-[#0e1014] px-3 py-2 text-white placeholder-neutral-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-medium text-neutral-300">Stack / Labels</label>
            <input
              type="text"
              placeholder="Redis, Node.js, PostgreSQL"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="mt-1.5 min-h-11 w-full rounded-lg border border-white/[0.08] bg-[#0e1014] px-3 py-2 text-white placeholder-neutral-500 focus:outline-none"
            />
          </div>

          <div className="flex flex-col-reverse items-stretch justify-end gap-2.5 border-t border-white/[0.07] pt-3 sm:flex-row sm:items-center sm:gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="min-h-11 rounded-lg px-3.5 py-1.5 font-medium text-neutral-400 hover:text-white"
            >
              Cancel
            </button>
            <FlowButton
              type="submit"
              disabled={loading}
              size="sm"
              variant="primary"
              text={loading ? 'Creating...' : 'Create initiative'}
            />
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateProjectModal;
