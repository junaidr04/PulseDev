import React from 'react';
import { useProjects } from '../context/ProjectContext';
import { useAuth } from '../context/AuthContext';
import { useSyncRoleCssVariables } from '../theme/roleTheme';
import RoleDashboard from '../components/dashboards/RoleDashboard';
import { FlowButton } from '../components/ui/FlowButton';

interface DashboardProps {
  onNavigate: (route: string) => void;
  onOpenNewTask: () => void;
  onOpenNewProject: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  onNavigate,
  onOpenNewTask,
  onOpenNewProject,
}) => {
  const { projects, tasks, activeProject, updateTaskColumn, rejectTask, approveTask } = useProjects();
  const { user } = useAuth();

  // Drive theme & CSS variables strictly from logged-in user's role in Auth/JWT context
  const roleTheme = useSyncRoleCssVariables(user?.role);

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const firstName = user?.name ? user.name.split(' ')[0] : 'Team';

  return (
    <div
      className="flex-1 overflow-y-auto bg-[#090b10] px-4 sm:px-6 pt-6 pb-24 text-[#f3f5f8]"
    >
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Shared Personalized Role Header */}
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between border-b border-white/[0.07] pb-5">
          <div className="min-w-0 space-y-1">
            <h1 className="text-2xl font-semibold text-white">
              {greeting}, {firstName}
            </h1>
            <p className="text-sm text-neutral-400">
              {activeProject ? `Working on ${activeProject.title}.` : roleTheme.tagline}
            </p>
          </div>

          {/* Right Header Controls: FlowButtons with morphing pill geometry & sliding arrows */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 flex-shrink-0">
            <FlowButton
              text="Team members"
              size="sm"
              variant="secondary"
              onClick={() => {
                sessionStorage.setItem('pulsedev_profile_tab', 'directory');
                window.dispatchEvent(
                  new CustomEvent('pulsedev:profile-tab', { detail: 'directory' })
                );
                onNavigate('profile');
              }}
              title="Open the team directory"
            />

            <FlowButton
              text="Sprint Board"
              size="sm"
              variant="secondary"
              onClick={() => onNavigate('board')}
            />

            <FlowButton
              text="New project"
              size="sm"
              variant="secondary"
              onClick={onOpenNewProject}
            />

            <FlowButton
              text="New issue"
              size="sm"
              variant="accent"
              accentColor={roleTheme.accentHex}
              onClick={onOpenNewTask}
            />
          </div>
        </div>

        {/* Dashboard content depends on the signed-in role. */}
        <RoleDashboard
          user={user}
          projects={projects}
          activeProject={activeProject}
          tasks={tasks}
          onNavigate={onNavigate}
          onOpenNewTask={onOpenNewTask}
          onOpenNewProject={onOpenNewProject}
          updateTaskColumn={updateTaskColumn}
          rejectTask={rejectTask}
          approveTask={approveTask}
        />
      </div>
    </div>
  );
};

export default Dashboard;
