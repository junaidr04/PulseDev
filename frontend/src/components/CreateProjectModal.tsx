import React, { useState } from 'react';
import { useProjects } from '../context/ProjectContext';
import { FlowButton } from './ui/FlowButton';
import Modal from './ui/Modal';


interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({ isOpen, onClose }) => {
  const { createProject } = useProjects();
  const [title, setTitle] = useState('');
  const [key, setKey] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<string>('Product');
  const [tags, setTags] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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
      setErrorMsg(err?.message || 'Could not create project.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={isOpen}
      title="New project"
      description="Add a project to the workspace."
      onClose={onClose}
    >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {errorMsg && (
            <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-2.5 text-rose-300">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="block font-medium text-neutral-300">Project name</label>
            <input
              type="text"
              required
              placeholder="e.g. Password reset flow"
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
                <option value="Product">Product</option>
                <option value="Engineering">Engineering</option>
                <option value="Infrastructure">Infrastructure</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-medium text-neutral-300">Summary</label>
            <textarea
              rows={3}
              required
              placeholder="What are you building?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-white/[0.08] bg-[#0e1014] px-3 py-2 text-white placeholder-neutral-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-medium text-neutral-300">Tags</label>
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
              text={loading ? 'Creating...' : 'Create project'}
            />
          </div>
        </form>
    </Modal>
  );
};

export default CreateProjectModal;
