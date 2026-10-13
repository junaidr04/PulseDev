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
            <h3 className="text-sm font-semibold text-white">New Initiative</h3>
            <p className="text-xs text-neutral-500 mt-0.5">Create a new engineering workspace initiative</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-500 hover:text-white p-1 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
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
              className="mt-1.5 w-full rounded-lg border border-white/[0.08] bg-[#0e1014] px-3 py-2 text-white placeholder-neutral-500 focus:border-white/[0.2] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-neutral-300">Key</label>
              <input
                type="text"
                required
                maxLength={8}
                placeholder="RATE"
                value={key}
                onChange={(e) => setKey(e.target.value.toUpperCase())}
                className="mt-1.5 w-full rounded-lg border border-white/[0.08] bg-[#0e1014] px-3 py-2 font-mono text-white placeholder-neutral-500 focus:outline-none uppercase"
              />
            </div>

            <div>
              <label className="block font-medium text-neutral-300">Area</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-white/[0.08] bg-[#0e1014] px-2.5 py-2 text-white focus:outline-none"
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
              className="mt-1.5 w-full rounded-lg border border-white/[0.08] bg-[#0e1014] px-3 py-2 text-white placeholder-neutral-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-medium text-neutral-300">Stack / Labels</label>
            <input
              type="text"
              placeholder="Redis, Node.js, PostgreSQL"
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
              text={loading ? 'Creating...' : 'Create initiative'}
            />
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateProjectModal;
