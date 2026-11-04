import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProjectProvider } from './context/ProjectContext';
import { useSyncRoleCssVariables } from './theme/roleTheme';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import CreateTaskModal from './components/CreateTaskModal';
import CreateProjectModal from './components/CreateProjectModal';
import TeamChatWidget from './components/TeamChatWidget';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import SprintBoard from './pages/SprintBoard';
import Projects from './pages/Projects';
import AiAssistant from './pages/AiAssistant';
import Profile from './pages/Profile';
import AdminAudit from './pages/AdminAudit';

class SafeViewBoundary extends React.Component<
  { children: React.ReactNode; onReset: () => void },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; onReset: () => void }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Workspace view failed to render.', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-1 flex-col items-center justify-center bg-[#090b10] p-6 text-center">
          <h2 className="text-base font-semibold text-white">This page could not be displayed.</h2>
          <p className="mt-1 text-sm text-neutral-400">
            Try another section or return to the overview.
          </p>
          <button
            type="button"
            onClick={() => {
              this.setState({ hasError: false });
              this.props.onReset();
            }}
            className="mt-4 rounded-md bg-white px-4 py-2 text-sm font-medium text-[#090b10] hover:bg-neutral-200"
          >
            Back to overview
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const AppContent: React.FC = () => {
  const { user, isAuthenticated, exitImpersonation } = useAuth();
  const [currentRoute, setCurrentRoute] = useState<string>(() =>
    sessionStorage.getItem('pulsedev_explicit_logout') === 'true' ? 'login' : 'dashboard'
  );
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);

  const isAdmin = isAuthenticated && user?.role === 'admin';
  const isImpersonating = Boolean(user?.impersonatedBy);
  const reducedMotion = useReducedMotion();
  useSyncRoleCssVariables(user?.role);

  useEffect(() => {
    if (!isAuthenticated) {
      setIsTaskModalOpen(false);
      setIsProjectModalOpen(false);
      if (currentRoute !== 'login' && currentRoute !== 'register') {
        setCurrentRoute('login');
      }
      return;
    }

    if (currentRoute === 'login' || currentRoute === 'register') {
      setCurrentRoute('dashboard');
      return;
    }

    if (currentRoute === 'admin-audit' && !isAdmin) {
      setCurrentRoute('dashboard');
    }
  }, [isAuthenticated, isAdmin, currentRoute]);

  const handleNavigate = (route: string) => {
    if (!isAuthenticated && route !== 'login' && route !== 'register') {
      setCurrentRoute('login');
      return;
    }
    if (route === 'admin-audit' && !isAdmin) {
      setCurrentRoute('dashboard');
      return;
    }
    setCurrentRoute(route);
  };

  const handleOpenNewProject = () => {
    if (!isAuthenticated) {
      setCurrentRoute('login');
      return;
    }
    setIsProjectModalOpen(true);
  };

  const handleOpenNewTask = () => {
    if (!isAuthenticated) {
      setCurrentRoute('login');
      return;
    }
    setIsTaskModalOpen(true);
  };

  const isAuthPage =
    !isAuthenticated || currentRoute === 'login' || currentRoute === 'register';

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-[#090b10] text-[#f3f5f8] font-sans antialiased selection:bg-emerald-500/20 selection:text-white">
      {isImpersonating && user && (
        <div className="z-40 flex items-center justify-between border-b border-amber-500/25 bg-amber-500/[0.08] px-4 py-2 text-sm text-amber-100">
          <span>
            Viewing as <strong className="font-medium text-white">{user.name}</strong>
            {user.impersonatedBy?.name ? ` (started by ${user.impersonatedBy.name})` : ''}
          </span>
          <button
            onClick={async () => {
              await exitImpersonation();
              setCurrentRoute('admin-audit');
            }}
            className="rounded-md border border-amber-400/30 px-2.5 py-1 text-xs font-medium text-white hover:bg-amber-400/10"
          >
            Stop viewing as this user
          </button>
        </div>
      )}

      <Navbar onNavigate={handleNavigate} activeRoute={currentRoute} />

      <div className="flex flex-1 flex-col overflow-hidden md:flex-row">
        {!isAuthPage && (
          <Sidebar
            currentRoute={currentRoute}
            onNavigate={handleNavigate}
            onOpenNewProject={handleOpenNewProject}
          />
        )}

        <main className="relative flex flex-1 flex-col overflow-hidden bg-[#090b10]">
          <SafeViewBoundary onReset={() => setCurrentRoute(isAuthenticated ? 'dashboard' : 'login')}>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={`${isAuthenticated ? 'workspace' : 'auth'}-${currentRoute}`}
                initial={reducedMotion ? false : { opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -3 }}
                transition={{ duration: reducedMotion ? 0 : 0.18, ease: 'easeOut' }}
                className="flex h-full w-full flex-1 flex-col overflow-hidden"
              >
                {!isAuthenticated ? (
                  currentRoute === 'register' ? (
                    <Register onNavigate={handleNavigate} />
                  ) : (
                    <Login onNavigate={handleNavigate} />
                  )
                ) : (
                  <>
                    {(currentRoute === 'dashboard' ||
                      currentRoute === 'home' ||
                      currentRoute === 'login' ||
                      currentRoute === 'register') && (
                      <Dashboard
                        onNavigate={handleNavigate}
                        onOpenNewTask={handleOpenNewTask}
                        onOpenNewProject={handleOpenNewProject}
                      />
                    )}
                    {currentRoute === 'board' && <SprintBoard onOpenNewTask={handleOpenNewTask} />}
                    {currentRoute === 'projects' && (
                      <Projects
                        onNavigate={handleNavigate}
                        onOpenNewProject={handleOpenNewProject}
                      />
                    )}
                    {currentRoute === 'ai' && <AiAssistant />}
                    {currentRoute === 'profile' && <Profile onNavigate={handleNavigate} />}
                    {currentRoute === 'admin-audit' && isAdmin && <AdminAudit />}
                  </>
                )}
              </motion.div>
            </AnimatePresence>
          </SafeViewBoundary>
        </main>
      </div>

      {isAuthenticated && (
        <>
          <CreateTaskModal
            isOpen={isTaskModalOpen}
            onClose={() => setIsTaskModalOpen(false)}
          />
          <CreateProjectModal
            isOpen={isProjectModalOpen}
            onClose={() => setIsProjectModalOpen(false)}
          />
          <TeamChatWidget />
        </>
      )}
    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <ProjectProvider>
        <AppContent />
      </ProjectProvider>
    </AuthProvider>
  );
}

export default App;
