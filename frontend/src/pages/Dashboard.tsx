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
  const { projects, tasks, activeProject, updateTaskColumn } = useProjects();
  const { user } = useAuth();

  // Drive theme & CSS variables strictly from logged-in user's role in Auth/JWT context
  const roleTheme = useSyncRoleCssVariables(user?.role);

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const firstName = user?.name ? user.name.split(' ')[0] : 'Team';

  return (
    <div
      className="flex-1 overflow-y-auto bg-[#090b10] role-ambient-grid px-4 sm:px-6 pt-6 pb-24 text-[#f3f5f8] relative"
      style={{ backgroundImage: roleTheme.radialBackdropCss }}
    >
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Shared Personalized Role Header */}
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between border-b border-white/[0.07] pb-5">
          <div className="space-y-1.5 min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-400">
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{
                  backgroundColor: roleTheme.accentHex,
                  boxShadow: `0 0 10px ${roleTheme.accentHex}`,
                }}
              />
              <span className="font-mono font-semibold text-white">
                {roleTheme.cockpitTitle}
              </span>
              <span aria-hidden="true">·</span>
              <span>{user?.title || roleTheme.roleTitle}</span>
              <span aria-hidden="true">·</span>
              <span className="text-neutral-300">
                {activeProject?.key || 'PAY'} — {activeProject?.title || 'Global Checkout & Payment Engine v2'}
              </span>
            </div>

            <h1 className="text-2xl sm:text-[28px] font-bold tracking-[-0.03em] text-white">
              {greeting},{' '}
              <span
                className="bg-clip-text text-transparent"
                style={{ backgroundImage: roleTheme.gradientCss }}
              >
                {firstName}
              </span>
            </h1>

            <p className="text-xs sm:text-[13px] text-neutral-400">
              {roleTheme.tagline}
            </p>
          </div>

          {/* Right Header Controls: FlowButtons with morphing pill geometry & sliding arrows */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 flex-shrink-0">
            <FlowButton
              text="Switch Role"
              size="sm"
              variant="secondary"
              onClick={() => {
                sessionStorage.setItem('pulsedev_profile_tab', 'directory');
                window.dispatchEvent(
                  new CustomEvent('pulsedev:profile-tab', { detail: 'directory' })
                );
                onNavigate('profile');
              }}
              title="Switch between the 5 role accounts in Team Directory"
            />

            <FlowButton
              text="Sprint Board"
              size="sm"
              variant="secondary"
              onClick={() => onNavigate('board')}
            />

            <FlowButton
              text="New Initiative"
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

        {/* Dynamic Role-Specific Cockpit (Admin, Lead, Developer, QA, or PM) */}
        <RoleDashboard
          user={user}
          projects={projects}
          activeProject={activeProject}
          tasks={tasks}
          onNavigate={onNavigate}
          onOpenNewTask={onOpenNewTask}
          onOpenNewProject={onOpenNewProject}
          updateTaskColumn={updateTaskColumn}
        />
      </div>
    </div>
  );
};

export default Dashboard;
