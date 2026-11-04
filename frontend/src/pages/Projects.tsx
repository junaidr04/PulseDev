import React from 'react';
import { useProjects, Project } from '../context/ProjectContext';
import { useAuth } from '../context/AuthContext';
import {
  Plus,
  ArrowUpRight,
  Lock,
} from 'lucide-react';
import { FlowButton } from '../components/ui/FlowButton';


interface ProjectsProps {
  onNavigate: (route: string) => void;
  onOpenNewProject: () => void;
}

export const Projects: React.FC<ProjectsProps> = ({ onNavigate, onOpenNewProject }) => {
  const { projects, activeProject, setActiveProject } = useProjects();
  const { user } = useAuth();

  const role = user?.role || 'developer';
  const isAdmin = role === 'admin';

  const handleSelectSprint = (project: Project) => {
    setActiveProject(project);
    onNavigate('board');
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#0b0c0e] px-6 py-7">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between border-b border-white/[0.07] pb-5">
          <div>
            <h1 className="text-xl font-semibold text-white tracking-tight">
              Initiatives
            </h1>
            <p className="text-[13px] text-neutral-400 mt-1">
              Long-term product roadmaps, platform migrations, and active engineering cycles.
            </p>
          </div>

          {user ? (
            <FlowButton
              text="New initiative"
              size="sm"
              variant="primary"
              onClick={onOpenNewProject}
            />
          ) : (
            <div className="flex items-center gap-1.5 text-xs text-neutral-500">
              <Lock className="h-3.5 w-3.5" />
              <span>Sign in to create initiatives</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {projects.map((proj) => {
            const isCurrent = activeProject?._id === proj._id;
            return (
              <div
                key={proj._id}
                onClick={() => handleSelectSprint(proj)}
                className={`group rounded-xl border p-5 transition-all duration-200 flex flex-col justify-between cursor-pointer ${
                  isCurrent
                    ? 'border-white/[0.18] bg-[#14171d]'
                    : 'border-white/[0.07] bg-[#111317] hover:border-white/[0.14] hover:bg-[#14171c]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-neutral-400">
                      {proj.key}
                    </span>
                    <span className="text-[11px] text-neutral-500">
                      {proj.category}
                    </span>
                  </div>

                  <h3 className="mt-2.5 text-base font-semibold text-white group-hover:text-neutral-100">
                    {proj.title}
                  </h3>

                  <p className="mt-1.5 text-xs text-neutral-400 leading-relaxed line-clamp-3">
                    {proj.description}
                  </p>

                  {proj.tags && proj.tags.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {proj.tags.map((t, i) => (
                        <span
                          key={i}
                          className="rounded bg-white/[0.04] px-2 py-0.5 font-mono text-[10px] text-neutral-400"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-6 pt-4 border-t border-white/[0.06] space-y-3">
                  <div>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-neutral-500">Completion</span>
                      <span className="font-mono text-neutral-300">{proj.progress}%</span>
                    </div>
                    <div className="h-1 w-full rounded-full bg-white/[0.06] overflow-hidden">
                      <div
                        className="h-full bg-indigo-400 transition-all duration-500"
                        style={{ width: `${proj.progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-neutral-500">
                      {isCurrent ? 'Selected workspace' : 'Click to open board'}
                    </span>
                    <span className="flex items-center gap-1 font-medium text-neutral-300 group-hover:text-white">
                      <span>Open</span>
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Projects;
