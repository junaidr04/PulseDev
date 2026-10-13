import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProjectProvider } from './context/ProjectContext';
import { getRoleTheme, useSyncRoleCssVariables } from './theme/roleTheme';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import CreateTaskModal from './components/CreateTaskModal';
import CreateProjectModal from './components/CreateProjectModal';
import TeamChatWidget from './components/TeamChatWidget';
import { CheckCircle2, ShieldCheck } from 'lucide-react';

// Pages
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
        <div className="flex-1 flex flex-col items-center justify-center bg-[#090b10] p-6 text-center">
          <h2 className="text-base font-semibold text-white">This page could not be displayed.</h2>
          <p className="mt-1 text-xs text-neutral-400">
            Try opening another section, or return to the overview.
          </p>
          <button
            type="button"
            onClick={() => {
              this.setState({ hasError: false });
              this.props.onReset();
            }}
            className="mt-4 rounded-lg bg-white px-4 py-1.5 text-xs font-semibold text-[#090b10] hover:bg-neutral-200 cursor-pointer"
          >
            Back to Overview
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const CUBIC_EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

const AppContent: React.FC = () => {
  const {
    user,
    isAuthenticated,
    exitImpersonation,
    introPhase,
    welcomeSplashUser,
  } = useAuth();
  const [currentRoute, setCurrentRoute] = useState<string>(() =>
    sessionStorage.getItem('pulsedev_explicit_logout') === 'true' ? 'login' : 'dashboard'
  );
  const [isTaskModalOpen, setIsTaskModalOpen] = useState<boolean>(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState<boolean>(false);

  const userRole = user?.role || 'guest';
  const isAdmin = isAuthenticated && userRole === 'admin';
  const isImpersonating = !!user?.impersonatedBy;
  useSyncRoleCssVariables(user?.role);
  const welcomeTheme = getRoleTheme(welcomeSplashUser?.role || user?.role);

  // Enforce authentication & auto-redirect to dashboard immediately upon login
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
    !isAuthenticated ||
    currentRoute === 'login' ||
    currentRoute === 'register';

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-[#090b10] text-[#f3f5f8] font-sans antialiased selection:bg-emerald-500/30 selection:text-white relative">
      <AnimatePresence mode="wait">
        {introPhase === 'welcome' && welcomeSplashUser && (
          <motion.div
            key="phase-welcome"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45, ease: CUBIC_EASE }}
            className="fixed inset-0 z-[95] flex items-center justify-center bg-[#090b10] p-6 select-none overflow-hidden"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.15 }}
              animate={{ opacity: [0, 0.55, 0.35, 0.2], scale: [0.15, 1.4, 2.8, 4.5] }}
              transition={{ duration: 3.8, ease: CUBIC_EASE }}
              style={{
                background: `radial-gradient(circle, rgba(${welcomeTheme.accentRgb}, 0.28) 0%, rgba(${welcomeTheme.accentRgb}, 0.08) 45%, transparent 72%)`,
              }}
              className="pointer-events-none absolute h-96 w-96 rounded-full blur-2xl"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 16, filter: 'blur(8px)' }}
              animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, scale: 0.97, y: -10, filter: 'blur(6px)' }}
              transition={{ duration: 0.55, ease: CUBIC_EASE }}
              className="relative flex w-full max-w-md flex-col items-center rounded-2xl border border-white/[0.1] bg-[#0d1118]/95 px-8 py-9 text-center shadow-[0_24px_70px_rgba(0,0,0,0.85)] overflow-hidden"
            >
              <div
                className="absolute top-0 left-0 right-0 h-[2.5px]"
                style={{ backgroundImage: welcomeTheme.gradientCss }}
              />

              <div className="relative mb-4">
                <div
                  className="absolute -inset-2 rounded-2xl blur-md opacity-40"
                  style={{ backgroundImage: welcomeTheme.gradientCss }}
                />
                <img
                  src={welcomeSplashUser.avatar}
                  alt={welcomeSplashUser.name}
                  className="relative h-18 w-18 rounded-2xl object-cover border border-white/[0.18] shadow-xl"
                />
                <span
                  className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full text-[#090b10] ring-3 ring-[#0d1118]"
                  style={{ backgroundColor: welcomeTheme.accentHex }}
                >
                  <CheckCircle2 className="h-3.5 w-3.5 stroke-[2.5]" />
                </span>
              </div>

              <div
                className="inline-flex items-center gap-1.5 rounded-full border px-3 py-0.5 text-[10px] font-mono font-semibold uppercase tracking-wider"
                style={{
                  borderColor: `rgba(${welcomeTheme.accentRgb}, 0.4)`,
                  backgroundColor: `rgba(${welcomeTheme.accentRgb}, 0.12)`,
                  color: welcomeTheme.accentHex,
                }}
              >
                <ShieldCheck className="h-3 w-3" />
                <span>
                  {welcomeTheme.shortBadge} · {welcomeTheme.cockpitTitle}
                </span>
              </div>

              <h1 className="mt-3.5 text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                Welcome,{' '}
                <span
                  className="bg-clip-text text-transparent"
                  style={{ backgroundImage: welcomeTheme.gradientCss }}
                >
                  {welcomeSplashUser.name}
                </span>
              </h1>

              <p className="mt-1.5 text-xs text-neutral-400">
                {welcomeSplashUser.title} · {welcomeSplashUser.department}
              </p>

              <div className="mt-6 h-1 w-44 overflow-hidden rounded-full bg-white/[0.06]">
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 3.85, ease: 'linear' }}
                  style={{ backgroundImage: welcomeTheme.gradientCss }}
                  className="h-full w-full origin-left"
                />
              </div>
            </motion.div>
          </motion.div>
        )}

      </AnimatePresence>

      <motion.div
        initial={false}
        animate={{
          opacity: introPhase === 'welcome' ? 0 : 1,
        }}
        transition={{
          duration: 0.25,
          ease: CUBIC_EASE,
        }}
        className="flex flex-1 flex-col overflow-hidden h-full w-full"
      >
        {isImpersonating && user && (
          <div className="z-40 flex items-center justify-between border-b border-amber-500/30 bg-amber-500/15 px-4 py-2 text-xs text-amber-200">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
              <span>
                You are currently viewing the application as{' '}
                <strong className="font-semibold text-white">{user.name}</strong>
                {user.impersonatedBy?.name ? ` (Impersonated by ${user.impersonatedBy.name})` : ''}
              </span>
            </div>
            <button
              onClick={async () => {
                await exitImpersonation();
                setCurrentRoute('admin-audit');
              }}
              className="rounded-md border border-amber-400/40 bg-amber-400/20 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-amber-400/30 cursor-pointer"
            >
              Exit impersonation
            </button>
          </div>
        )}

        <Navbar
          onNavigate={handleNavigate}
          activeRoute={currentRoute}
        />

        <div className="flex flex-1 flex-col md:flex-row overflow-hidden">
          {!isAuthPage && (
            <Sidebar
              currentRoute={currentRoute}
              onNavigate={handleNavigate}
              onOpenNewProject={handleOpenNewProject}
            />
          )}

          <main className="flex-1 flex flex-col overflow-hidden bg-[#090b10] relative">
            <SafeViewBoundary onReset={() => setCurrentRoute(isAuthenticated ? 'dashboard' : 'login')}>
              <motion.div
                style={{ willChange: 'transform, opacity' }}
                className="flex-1 flex flex-col overflow-hidden h-full w-full"
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
                    {currentRoute === 'board' && (
                      <SprintBoard onOpenNewTask={handleOpenNewTask} />
                    )}
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
            </SafeViewBoundary>
          </main>
        </div>

        {isAuthenticated && (
          <CreateTaskModal
            isOpen={isTaskModalOpen}
            onClose={() => setIsTaskModalOpen(false)}
          />
        )}
        {isAuthenticated && (
          <CreateProjectModal
            isOpen={isProjectModalOpen}
            onClose={() => setIsProjectModalOpen(false)}
          />
        )}

        {/* Floating Team Chat Widget */}
        {isAuthenticated && <TeamChatWidget />}
      </motion.div>
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
