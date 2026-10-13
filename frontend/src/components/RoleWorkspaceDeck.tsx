import React, { useState, useEffect } from 'react';
import { Task, Project } from '../context/ProjectContext';
import { User } from '../context/AuthContext';
import {
  ShieldCheck,
  Server,
  Cpu,
  Terminal,
  GitBranch,
  GitPullRequest,
  Play,
  RotateCcw,
  Check,
  CheckCircle2,
  Sparkles,
  Activity,
  Layers,
  Zap,
  Bug,
  FlaskConical,
  Copy,
  Timer,
  Pause,
  Plus,
  ArrowUpRight,
  Database,
  RefreshCw,
  Workflow,
  Lock,
} from 'lucide-react';

interface RoleWorkspaceDeckProps {
  user: User | null;
  tasks: Task[];
  projects: Project[];
  activeProject: Project | null;
  onNavigate: (route: string) => void;
  onOpenNewTask: () => void;
  onOpenNewProject: () => void;
  updateTaskColumn: (taskId: string, column: Task['column']) => Promise<void>;
}

export type PersonaRoleKey = 'admin' | 'lead' | 'developer' | 'qa' | 'guest';

export const ROLE_THEME_CONFIG: Record<
  PersonaRoleKey,
  {
    personaName: string;
    roleTitle: string;
    workspaceName: string;
    tagline: string;
    badgeText: string;
    accentText: string;
    accentBorder: string;
    accentBg: string;
    gradientText: string;
    gradientBar: string;
    radialGlow: string;
    buttonGradient: string;
  }
> = {
  admin: {
    personaName: 'Alex Chen',
    roleTitle: 'Principal Architect',
    workspaceName: 'System Architecture & Governance Command',
    tagline: 'Enterprise service topology, RFC sign-offs, cross-initiative velocity & zero-trust security.',
    badgeText: 'ARCHITECT COMMAND',
    accentText: 'text-emerald-400',
    accentBorder: 'border-emerald-500/30',
    accentBg: 'bg-emerald-500/10',
    gradientText: 'from-emerald-300 via-teal-200 to-cyan-300',
    gradientBar: 'from-emerald-400 via-teal-400 to-cyan-400',
    radialGlow:
      'radial-gradient(ellipse 75% 45% at 50% -10%, rgba(16, 185, 129, 0.16), transparent 70%)',
    buttonGradient: 'from-emerald-400 to-cyan-400',
  },
  lead: {
    personaName: 'Priya Patel',
    roleTitle: 'Staff Backend Lead',
    workspaceName: 'Distributed Systems & API Telemetry Studio',
    tagline: 'Microservice p99 latency, worker pool orchestration, Redis cache clusters & backend PR reviews.',
    badgeText: 'BACKEND LEAD STUDIO',
    accentText: 'text-violet-400',
    accentBorder: 'border-violet-500/30',
    accentBg: 'bg-violet-500/10',
    gradientText: 'from-violet-300 via-indigo-200 to-sky-300',
    gradientBar: 'from-violet-400 via-indigo-400 to-sky-400',
    radialGlow:
      'radial-gradient(ellipse 75% 45% at 50% -10%, rgba(139, 92, 246, 0.18), transparent 70%)',
    buttonGradient: 'from-violet-400 via-indigo-400 to-sky-400',
  },
  developer: {
    personaName: 'Marcus Vance',
    roleTitle: 'Senior Software Engineer',
    workspaceName: 'Deep-Work Engineering & CI/CD Workbench',
    tagline: 'Personal sprint execution queue, live CI/CD preview pipelines, branch checkout & flow timer.',
    badgeText: 'DEVELOPER WORKBENCH',
    accentText: 'text-cyan-400',
    accentBorder: 'border-cyan-500/30',
    accentBg: 'bg-cyan-500/10',
    gradientText: 'from-cyan-300 via-sky-200 to-blue-300',
    gradientBar: 'from-cyan-400 via-sky-400 to-blue-500',
    radialGlow:
      'radial-gradient(ellipse 75% 45% at 50% -10%, rgba(6, 182, 212, 0.17), transparent 70%)',
    buttonGradient: 'from-cyan-400 to-blue-400',
  },
  qa: {
    personaName: 'Sophia Laurent',
    roleTitle: 'QA Automation Lead',
    workspaceName: 'Quality Verification & E2E Automation Lab',
    tagline: 'Automated Playwright regression suites, release gate sign-off queue & zero-defect verification.',
    badgeText: 'QA AUTOMATION LAB',
    accentText: 'text-amber-400',
    accentBorder: 'border-amber-500/30',
    accentBg: 'bg-amber-500/10',
    gradientText: 'from-amber-300 via-orange-200 to-rose-300',
    gradientBar: 'from-amber-400 via-orange-400 to-rose-400',
    radialGlow:
      'radial-gradient(ellipse 75% 45% at 50% -10%, rgba(245, 158, 11, 0.16), transparent 70%)',
    buttonGradient: 'from-amber-400 to-orange-400',
  },
  guest: {
    personaName: 'Jordan Blake',
    roleTitle: 'Product Manager',
    workspaceName: 'Product Strategy, OKR & Roadmap Studio',
    tagline: 'Quarterly product OKRs, customer feedback prioritization, stakeholder delivery & roadmap milestones.',
    badgeText: 'PRODUCT STRATEGY STUDIO',
    accentText: 'text-rose-400',
    accentBorder: 'border-rose-500/30',
    accentBg: 'bg-rose-500/10',
    gradientText: 'from-rose-300 via-pink-200 to-amber-200',
    gradientBar: 'from-rose-400 via-pink-400 to-orange-400',
    radialGlow:
      'radial-gradient(ellipse 75% 45% at 50% -10%, rgba(244, 63, 94, 0.16), transparent 70%)',
    buttonGradient: 'from-rose-400 to-pink-500',
  },
};

export const RoleWorkspaceDeck: React.FC<RoleWorkspaceDeckProps> = ({
  user,
  tasks,
  projects,
  activeProject,
  onNavigate,
  onOpenNewTask,
  onOpenNewProject,
  updateTaskColumn,
}) => {
  const actualRole: PersonaRoleKey =
    user?.role === 'lead' ||
    user?.role === 'developer' ||
    user?.role === 'qa' ||
    user?.role === 'guest'
      ? user.role
      : 'admin';

  // Sync active role view with the authenticated user's role
  const [activePersonaRole, setActivePersonaRole] = useState<PersonaRoleKey>(actualRole);

  useEffect(() => {
    setActivePersonaRole(actualRole);
  }, [actualRole, user?._id]);

  // --- 1. ALEX CHEN (PRINCIPAL ARCHITECT) STATE ---
  const [rfcs, setRfcs] = useState([
    {
      id: 'RFC-042',
      title: 'Zero-Downtime Multi-Region Payment Sharding',
      service: 'PAY-CORE',
      author: 'Alex Chen',
      status: 'approved' as 'approved' | 'pending',
      impact: '99.995% SLA',
    },
    {
      id: 'RFC-045',
      title: '3DS 2.0 Hardware Passkey Biometric Fallback',
      service: 'AUTH-EDGE',
      author: 'Priya Patel',
      status: 'pending' as 'approved' | 'pending',
      impact: '-22% Latency',
    },
    {
      id: 'RFC-048',
      title: 'Optimistic Offline Conflict CRDT Sync Engine',
      service: 'MOB-SYNC',
      author: 'Marcus Vance',
      status: 'pending' as 'approved' | 'pending',
      impact: 'Sub-80ms Sync',
    },
  ]);
  const [drillRunning, setDrillRunning] = useState(false);
  const [drillVerified, setDrillVerified] = useState(false);

  const handleTriggerFailoverDrill = () => {
    setDrillRunning(true);
    setDrillVerified(false);
    setTimeout(() => {
      setDrillRunning(false);
      setDrillVerified(true);
    }, 1100);
  };

  // --- 2. PRIYA PATEL (STAFF BACKEND LEAD) STATE ---
  const [services, setServices] = useState([
    {
      name: 'Payment Settlement Worker',
      cluster: 'us-east-1 · k8s',
      p99: 14,
      rps: '6,420/s',
      replicas: 6,
      healthy: true,
    },
    {
      name: 'Idempotency Ledger Engine',
      cluster: 'eu-central-1 · k8s',
      p99: 19,
      rps: '4,890/s',
      replicas: 4,
      healthy: true,
    },
    {
      name: 'Redis Session & Rate-Limit Mesh',
      cluster: 'global-edge',
      p99: 3,
      rps: '28,100/s',
      replicas: 8,
      healthy: true,
    },
  ]);
  const [cacheFlushed, setCacheFlushed] = useState(false);
  const [backendPRs, setBackendPRs] = useState([
    {
      id: '#418',
      title: 'feat(ledger): distributed Redis lock for double-charge prevention',
      author: 'Marcus Vance',
      diff: '+284 -42',
      merged: false,
    },
    {
      id: '#421',
      title: 'perf(webhooks): batch Stripe settlement events with zero-copy buffer',
      author: 'Priya Patel',
      diff: '+162 -38',
      merged: false,
    },
  ]);

  const handleScaleWorkers = (idx: number) => {
    setServices((prev) =>
      prev.map((s, i) =>
        i === idx
          ? { ...s, replicas: s.replicas + 2, p99: Math.max(2, s.p99 - 3) }
          : s
      )
    );
  };

  const handleFlushCache = () => {
    setCacheFlushed(true);
    setTimeout(() => setCacheFlushed(false), 2200);
  };

  // --- 3. MARCUS VANCE (SENIOR SOFTWARE ENGINEER) STATE ---
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);
  const [pipelineRunning, setPipelineRunning] = useState(false);
  const [pipelineStep, setPipelineStep] = useState(4);
  const [focusSeconds, setFocusSeconds] = useState(25 * 60);
  const [focusRunning, setFocusRunning] = useState(false);

  useEffect(() => {
    if (!focusRunning) return;
    const interval = setInterval(() => {
      setFocusSeconds((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [focusRunning]);

  const handleRunPipeline = () => {
    if (pipelineRunning) return;
    setPipelineRunning(true);
    setPipelineStep(1);
    setTimeout(() => setPipelineStep(2), 400);
    setTimeout(() => setPipelineStep(3), 850);
    setTimeout(() => {
      setPipelineStep(4);
      setPipelineRunning(false);
    }, 1350);
  };

  const copyCommand = (id: string, cmd: string) => {
    navigator.clipboard?.writeText(cmd);
    setCopiedCmd(id);
    setTimeout(() => setCopiedCmd(null), 1800);
  };

  const formatTimer = (totalSec: number) => {
    const m = Math.floor(totalSec / 60)
      .toString()
      .padStart(2, '0');
    const s = (totalSec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // --- 4. SOPHIA LAURENT (QA AUTOMATION LEAD) STATE ---
  const [e2eRunning, setE2eRunning] = useState(false);
  const [suites, setSuites] = useState([
    {
      id: 'suite-3ds',
      name: '3D Secure 2.0 Biometric Checkout E2E',
      browser: 'Chromium · WebKit',
      specs: 42,
      passed: 42,
      duration: '3.8s',
    },
    {
      id: 'suite-wallet',
      name: 'Apple Pay & Google Pay Sheet Regression',
      browser: 'Mobile Safari · Chrome',
      specs: 28,
      passed: 28,
      duration: '2.9s',
    },
    {
      id: 'suite-rbac',
      name: 'IDOR & Role Authorization Boundary Suite',
      browser: 'API · Supertest',
      specs: 64,
      passed: 64,
      duration: '1.4s',
    },
  ]);

  const handleRunE2ESuite = () => {
    if (e2eRunning) return;
    setE2eRunning(true);
    setTimeout(() => {
      setSuites((prev) =>
        prev.map((s) => ({
          ...s,
          duration: `${(Math.random() * 1.5 + 1.4).toFixed(1)}s`,
        }))
      );
      setE2eRunning(false);
    }, 1100);
  };

  // --- 5. JORDAN BLAKE (PRODUCT MANAGER) STATE ---
  const [okrs, setOkrs] = useState([
    {
      id: 'OKR-Q4-1',
      objective: 'Increase Global One-Click Checkout Conversion by +18%',
      metric: '94.2% Target Met',
      confidence: 'High Confidence',
      prioritized: true,
    },
    {
      id: 'OKR-Q4-2',
      objective: 'Reduce Mobile Biometric Drop-off Below 1.2% Across EU/US',
      metric: '86.0% Target Met',
      confidence: 'On Track',
      prioritized: true,
    },
    {
      id: 'OKR-Q4-3',
      objective: 'Ship Self-Serve Enterprise Webhook & Audit Export Portal',
      metric: '72.5% Target Met',
      confidence: 'Needs Review',
      prioritized: false,
    },
  ]);

  const theme = ROLE_THEME_CONFIG[activePersonaRole];
  const inReviewTasks = tasks.filter((t) => t.column === 'in_review');
  const myDeveloperTasks = tasks.filter(
    (t) =>
      t.column !== 'completed' &&
      (t.assignee?.name?.toLowerCase().includes('marcus') ||
        t.assigneeId === user?._id ||
        t.column === 'in_progress')
  );

  return (
    <div className="space-y-4">
      {/* Role Workspace Signature Header Bar */}
      <div className="relative overflow-hidden rounded-2xl border border-white/[0.09] bg-[#0d111a]/95 p-5 shadow-[0_20px_50px_rgba(0,0,0,0.6)]">
        {/* Top Luminous Role Accent Line */}
        <div
          className={`absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r ${theme.gradientBar}`}
        />

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2.5 text-xs">
              <span
                className={`inline-flex items-center gap-1.5 font-mono text-[11px] font-semibold ${theme.accentText}`}
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>{theme.badgeText}</span>
              </span>
              <span className="text-neutral-600">·</span>
              <span className="font-medium text-white">{theme.personaName}</span>
              <span className="text-neutral-600">·</span>
              <span className="text-neutral-300">{theme.roleTitle}</span>
            </div>

            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white">
              {theme.workspaceName}
            </h2>
            <p className="text-xs text-neutral-400 max-w-2xl">{theme.tagline}</p>
          </div>

          {/* Interactive Role Interface Switcher (Allows previewing all 4 tailored employee interfaces) */}
          <div className="flex flex-col sm:items-end gap-1.5">
            <span className="text-[10px] font-mono text-neutral-400">
              Role-Tailored Workspace View (Active: {theme.personaName})
            </span>
            <div className="flex flex-wrap items-center gap-1 rounded-xl border border-white/[0.08] bg-[#080a10] p-1">
              {(
                [
                  { key: 'admin', name: 'Alex', role: 'Architect', dot: 'bg-emerald-400' },
                  { key: 'lead', name: 'Priya', role: 'Backend Lead', dot: 'bg-violet-400' },
                  { key: 'developer', name: 'Marcus', role: 'Sr. Engineer', dot: 'bg-cyan-400' },
                  { key: 'qa', name: 'Sophia', role: 'QA Lead', dot: 'bg-amber-400' },
                  { key: 'guest', name: 'Jordan', role: 'Product Mgr', dot: 'bg-rose-400' },
                ] as const
              ).map((tab) => {
                const isSelected = activePersonaRole === tab.key;
                const isLoggedUserRole = actualRole === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActivePersonaRole(tab.key)}
                    className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-white/[0.1] text-white font-semibold shadow-sm border border-white/[0.14]'
                        : 'text-neutral-400 hover:text-neutral-200 hover:bg-white/[0.04] border border-transparent'
                    }`}
                  >
                    <span className={`h-2 w-2 rounded-full ${tab.dot}`} />
                    <span>{tab.name}</span>
                    <span className="hidden sm:inline text-[10px] text-neutral-400">
                      · {tab.role}
                    </span>
                    {isLoggedUserRole && (
                      <span className="ml-0.5 text-[9px] font-mono text-emerald-400">●</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* =====================================================================
            INTERFACE 1: ALEX CHEN — PRINCIPAL ARCHITECT (role: 'admin')
           ===================================================================== */}
        {activePersonaRole === 'admin' && (
          <div className="mt-5 grid grid-cols-1 lg:grid-cols-12 gap-4 pt-4 border-t border-white/[0.07]">
            {/* Left 7 Cols: System Topology & SLA Health */}
            <div className="lg:col-span-7 rounded-xl border border-emerald-500/20 bg-[#090d14] p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-emerald-400" />
                  <h3 className="text-xs font-semibold text-white">
                    Enterprise System Topology & Multi-Region SLA
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={handleTriggerFailoverDrill}
                  className="flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-300 hover:bg-emerald-500/20 transition-colors cursor-pointer"
                >
                  <RefreshCw className={`h-3 w-3 ${drillRunning ? 'animate-spin' : ''}`} />
                  <span>
                    {drillRunning
                      ? 'Simulating Failover...'
                      : drillVerified
                      ? 'Zero-Downtime Verified ✓'
                      : 'Run Failover Drill'}
                  </span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {[
                  {
                    node: 'Checkout Engine v2',
                    region: 'us-east · eu-west',
                    sla: '99.99%',
                    latency: '18ms p99',
                    status: 'Healthy',
                  },
                  {
                    node: '3DS Biometric Mesh',
                    region: 'global-edge',
                    sla: '99.98%',
                    latency: '24ms p99',
                    status: 'Healthy',
                  },
                  {
                    node: 'Zero-Trust Auth Vault',
                    region: 'multi-region',
                    sla: '100.0%',
                    latency: '6ms p99',
                    status: 'Protected',
                  },
                ].map((item) => (
                  <div
                    key={item.node}
                    className="rounded-lg border border-white/[0.07] bg-[#0e131d] p-3 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-white truncate">
                        {item.node}
                      </span>
                      <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#10b981]" />
                    </div>
                    <div className="text-[11px] text-neutral-400">{item.region}</div>
                    <div className="flex items-center justify-between pt-1 border-t border-white/[0.05] font-mono text-[11px]">
                      <span className="text-emerald-400">{item.sla}</span>
                      <span className="text-neutral-300">{item.latency}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs text-neutral-400">
                <span>
                  Active Portfolio: <strong className="text-white">{projects.length} Initiatives</strong> · RBAC Governance Enforced
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onNavigate('admin-audit')}
                    className="text-xs font-medium text-emerald-400 hover:text-emerald-300 cursor-pointer"
                  >
                    Security & Audit Logs →
                  </button>
                </div>
              </div>
            </div>

            {/* Right 5 Cols: Architecture RFC Sign-Off Queue */}
            <div className="lg:col-span-5 rounded-xl border border-white/[0.08] bg-[#090d14] p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-cyan-400" />
                  <h3 className="text-xs font-semibold text-white">
                    Architecture RFC Sign-Off Queue
                  </h3>
                </div>
                <span className="font-mono text-[11px] text-neutral-400">
                  {rfcs.filter((r) => r.status === 'approved').length}/{rfcs.length} Approved
                </span>
              </div>

              <div className="space-y-2">
                {rfcs.map((rfc) => (
                  <div
                    key={rfc.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-white/[0.06] bg-[#0e131d] px-3 py-2"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] text-emerald-400">
                          {rfc.id}
                        </span>
                        <span className="text-xs font-medium text-white truncate">
                          {rfc.title}
                        </span>
                      </div>
                      <div className="text-[11px] text-neutral-400 mt-0.5">
                        {rfc.service} · {rfc.author} · <span className="font-mono text-cyan-300">{rfc.impact}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setRfcs((prev) =>
                          prev.map((item) =>
                            item.id === rfc.id
                              ? {
                                  ...item,
                                  status: item.status === 'approved' ? 'pending' : 'approved',
                                }
                              : item
                          )
                        )
                      }
                      className={`flex-shrink-0 rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-colors cursor-pointer ${
                        rfc.status === 'approved'
                          ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                          : 'bg-cyan-500 text-[#090b10] hover:bg-cyan-400'
                      }`}
                    >
                      {rfc.status === 'approved' ? 'Signed Off ✓' : 'Approve RFC'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* =====================================================================
            INTERFACE 2: PRIYA PATEL — STAFF BACKEND LEAD (role: 'lead')
           ===================================================================== */}
        {activePersonaRole === 'lead' && (
          <div className="mt-5 grid grid-cols-1 lg:grid-cols-12 gap-4 pt-4 border-t border-white/[0.07]">
            {/* Left 7 Cols: Distributed Microservices & Worker Pool Console */}
            <div className="lg:col-span-7 rounded-xl border border-violet-500/25 bg-[#0a0c16] p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Server className="h-4 w-4 text-violet-400" />
                  <h3 className="text-xs font-semibold text-white">
                    Distributed Backend Services & Worker Clusters
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={handleFlushCache}
                  className="flex items-center gap-1.5 rounded-lg border border-violet-500/30 bg-violet-500/10 px-2.5 py-1 text-[11px] font-medium text-violet-300 hover:bg-violet-500/20 transition-colors cursor-pointer"
                >
                  <Database className="h-3 w-3" />
                  <span>{cacheFlushed ? 'Redis Cluster Flushed ✓' : 'Flush Redis Cache'}</span>
                </button>
              </div>

              <div className="divide-y divide-white/[0.06] rounded-lg border border-white/[0.06] bg-[#0e111f]">
                {services.map((svc, idx) => (
                  <div
                    key={svc.name}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-3.5 py-2.5"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-violet-400 shadow-[0_0_8px_#8b5cf6]" />
                        <span className="text-xs font-semibold text-white">{svc.name}</span>
                        <span className="font-mono text-[10px] text-neutral-400">
                          {svc.cluster}
                        </span>
                      </div>
                      <div className="mt-0.5 flex items-center gap-3 font-mono text-[11px] text-neutral-400">
                        <span>
                          Throughput: <strong className="text-neutral-200">{svc.rps}</strong>
                        </span>
                        <span>·</span>
                        <span>
                          p99: <strong className="text-violet-300">{svc.p99}ms</strong>
                        </span>
                        <span>·</span>
                        <span>
                          Pods: <strong className="text-sky-300">{svc.replicas} active</strong>
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleScaleWorkers(idx)}
                      className="self-start sm:self-center rounded-lg border border-violet-500/30 bg-violet-500/10 px-2.5 py-1 text-[11px] font-medium text-violet-200 hover:bg-violet-500/20 transition-colors cursor-pointer"
                    >
                      + Scale Pods
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Right 5 Cols: Backend PR Review Queue & Team Load */}
            <div className="lg:col-span-5 rounded-xl border border-white/[0.08] bg-[#0a0c16] p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <GitPullRequest className="h-4 w-4 text-sky-400" />
                  <h3 className="text-xs font-semibold text-white">
                    Backend PRs Awaiting Staff Lead Sign-Off
                  </h3>
                </div>
                <span className="font-mono text-[11px] text-violet-300">
                  {backendPRs.filter((p) => !p.merged).length} Open
                </span>
              </div>

              <div className="space-y-2">
                {backendPRs.map((pr) => (
                  <div
                    key={pr.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-white/[0.06] bg-[#0e111f] px-3 py-2.5"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] text-violet-400">{pr.id}</span>
                        <span className="text-xs font-medium text-white truncate">
                          {pr.title}
                        </span>
                      </div>
                      <div className="mt-0.5 text-[11px] text-neutral-400">
                        Author: {pr.author} · <span className="font-mono text-emerald-400">{pr.diff}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setBackendPRs((prev) =>
                          prev.map((item) =>
                            item.id === pr.id ? { ...item, merged: !item.merged } : item
                          )
                        )
                      }
                      className={`flex-shrink-0 rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-colors cursor-pointer ${
                        pr.merged
                          ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                          : 'bg-violet-500 text-white hover:bg-violet-400'
                      }`}
                    >
                      {pr.merged ? 'Merged ✓' : 'Approve & Merge'}
                    </button>
                  </div>
                ))}
              </div>

              <div className="pt-1 flex items-center justify-between text-xs text-neutral-400">
                <span>Sprint Engineering Capacity: 88% Optimal</span>
                <button
                  type="button"
                  onClick={() => onNavigate('board')}
                  className="font-medium text-violet-400 hover:text-violet-300 cursor-pointer"
                >
                  Manage Sprint Board →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =====================================================================
            INTERFACE 3: MARCUS VANCE — SENIOR SOFTWARE ENGINEER (role: 'developer')
           ===================================================================== */}
        {activePersonaRole === 'developer' && (
          <div className="mt-5 grid grid-cols-1 lg:grid-cols-12 gap-4 pt-4 border-t border-white/[0.07]">
            {/* Left 7 Cols: Interactive CI/CD Pipeline & Quick Git Checkout */}
            <div className="lg:col-span-7 rounded-xl border border-cyan-500/25 bg-[#081018] p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Terminal className="h-4 w-4 text-cyan-400" />
                  <h3 className="text-xs font-semibold text-white">
                    Active Feature Branch & Live CI/CD Preview Pipeline
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={handleRunPipeline}
                  className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-cyan-400 to-blue-500 px-2.5 py-1 text-[11px] font-semibold text-[#090b10] hover:opacity-95 transition-opacity cursor-pointer"
                >
                  <Play className="h-3 w-3 fill-current" />
                  <span>{pipelineRunning ? 'Building Preview...' : 'Trigger Preview Deploy'}</span>
                </button>
              </div>

              {/* 4-Stage Pipeline Stepper */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { step: 1, name: '1. Typecheck & Lint', time: '1.2s' },
                  { step: 2, name: '2. Unit Suite (412)', time: '3.4s' },
                  { step: 3, name: '3. Docker Image', time: '4.1s' },
                  { step: 4, name: '4. Edge Preview', time: '0.9s' },
                ].map((stage) => {
                  const done = pipelineStep >= stage.step && !pipelineRunning;
                  const active = pipelineRunning && pipelineStep === stage.step;
                  return (
                    <div
                      key={stage.step}
                      className={`rounded-lg border p-2.5 transition-all ${
                        active
                          ? 'border-cyan-400 bg-cyan-500/15'
                          : done
                          ? 'border-emerald-500/25 bg-emerald-500/[0.07]'
                          : 'border-white/[0.06] bg-[#0c141f]'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[11px] font-medium text-white">
                        <span className="truncate">{stage.name}</span>
                        {done && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0" />}
                      </div>
                      <div className="mt-1 font-mono text-[10px] text-neutral-400">
                        {active ? 'Running...' : `Passed · ${stage.time}`}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Quick Git Branch Checkout Bar */}
              <div className="flex items-center justify-between gap-2 rounded-lg border border-white/[0.07] bg-[#0b131e] px-3 py-2 font-mono text-[11px]">
                <div className="flex items-center gap-2 min-w-0 text-cyan-300 truncate">
                  <GitBranch className="h-3.5 w-3.5 text-cyan-400 flex-shrink-0" />
                  <span className="truncate">
                    git checkout -b feat/{activeProject?.key?.toLowerCase() || 'pay'}-biometric-token-vault
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    copyCommand(
                      'branch-main',
                      `git checkout -b feat/${activeProject?.key?.toLowerCase() || 'pay'}-biometric-token-vault`
                    )
                  }
                  className="flex items-center gap-1 rounded bg-white/[0.07] px-2 py-1 text-[10px] text-white hover:bg-white/[0.12] flex-shrink-0 cursor-pointer"
                >
                  <Copy className="h-3 w-3" />
                  <span>{copiedCmd === 'branch-main' ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {/* Right 5 Cols: Deep-Work Flow Timer & Assigned Sprint Queue */}
            <div className="lg:col-span-5 rounded-xl border border-white/[0.08] bg-[#081018] p-4 flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Timer className="h-4 w-4 text-cyan-400" />
                  <h3 className="text-xs font-semibold text-white">
                    Deep-Work Engineering Flow Timer
                  </h3>
                </div>
                <span className="font-mono text-sm font-bold text-cyan-300 tabular-nums">
                  {formatTimer(focusSeconds)}
                </span>
              </div>

              <div className="flex items-center justify-between gap-2 rounded-lg border border-white/[0.06] bg-[#0c1522] p-3">
                <div>
                  <div className="text-xs font-medium text-white">
                    Active Focus: {myDeveloperTasks[0]?.title || 'Biometric Checkout SDK'}
                  </div>
                  <div className="text-[11px] text-neutral-400 mt-0.5">
                    {myDeveloperTasks.length} active sprint issues in your queue
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => setFocusRunning(!focusRunning)}
                    className="flex items-center gap-1 rounded-lg bg-cyan-400 px-2.5 py-1.5 text-[11px] font-semibold text-[#090b10] hover:bg-cyan-300 cursor-pointer"
                  >
                    {focusRunning ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                    <span>{focusRunning ? 'Pause' : 'Start Flow'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFocusRunning(false);
                      setFocusSeconds(25 * 60);
                    }}
                    className="rounded-lg border border-white/[0.08] bg-white/[0.04] px-2 py-1.5 text-[11px] text-neutral-300 hover:text-white cursor-pointer"
                  >
                    Reset
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-neutral-400">
                <span>Press j/k below to cycle issues</span>
                <button
                  type="button"
                  onClick={onOpenNewTask}
                  className="font-medium text-cyan-400 hover:text-cyan-300 cursor-pointer"
                >
                  + Create Dev Task →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =====================================================================
            INTERFACE 4: SOPHIA LAURENT — QA AUTOMATION LEAD (role: 'qa')
           ===================================================================== */}
        {activePersonaRole === 'qa' && (
          <div className="mt-5 grid grid-cols-1 lg:grid-cols-12 gap-4 pt-4 border-t border-white/[0.07]">
            {/* Left 7 Cols: Automated E2E Playwright Test Matrix */}
            <div className="lg:col-span-7 rounded-xl border border-amber-500/25 bg-[#120e0a] p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FlaskConical className="h-4 w-4 text-amber-400" />
                  <h3 className="text-xs font-semibold text-white">
                    Automated Playwright E2E & Regression Matrix
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={handleRunE2ESuite}
                  className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-amber-400 to-orange-400 px-2.5 py-1 text-[11px] font-semibold text-[#090b10] hover:opacity-95 transition-opacity cursor-pointer"
                >
                  <Play className="h-3 w-3 fill-current" />
                  <span>{e2eRunning ? 'Running 134 Specs...' : 'Run Full E2E Suite'}</span>
                </button>
              </div>

              <div className="divide-y divide-white/[0.06] rounded-lg border border-white/[0.07] bg-[#17120d]">
                {suites.map((suite) => (
                  <div
                    key={suite.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-3.5 py-2.5"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#10b981]" />
                        <span className="text-xs font-semibold text-white">{suite.name}</span>
                      </div>
                      <div className="mt-0.5 text-[11px] text-neutral-400">
                        {suite.browser} · <span className="font-mono text-emerald-400">{suite.passed}/{suite.specs} passed</span>
                      </div>
                    </div>
                    <span className="font-mono text-xs text-amber-300">
                      {e2eRunning ? 'Executing...' : suite.duration}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right 5 Cols: QA Release Gate & Instant Sign-Off Queue */}
            <div className="lg:col-span-5 rounded-xl border border-white/[0.08] bg-[#120e0a] p-4 flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bug className="h-4 w-4 text-amber-400" />
                  <h3 className="text-xs font-semibold text-white">
                    QA Release Gate ({inReviewTasks.length} Awaiting Verification)
                  </h3>
                </div>
                <span className="font-mono text-[11px] text-emerald-400">98.6% Coverage</span>
              </div>

              {inReviewTasks.length === 0 ? (
                <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-4 text-center text-xs text-emerald-300">
                  All submitted issues verified! Release gate is green for production deployment.
                </div>
              ) : (
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {inReviewTasks.map((task) => (
                    <div
                      key={task._id}
                      className="flex items-center justify-between gap-2 rounded-lg border border-white/[0.07] bg-[#17120d] px-3 py-2"
                    >
                      <div className="min-w-0">
                        <div className="text-xs font-medium text-white truncate">
                          {task.title}
                        </div>
                        <div className="text-[10px] text-neutral-400 font-mono">
                          {activeProject?.key || 'PAY'} · Ready for QA Sign-off
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => updateTaskColumn(task._id, 'in_progress')}
                          className="rounded-md border border-white/[0.1] bg-white/[0.05] px-2 py-1 text-[10px] text-neutral-300 hover:text-white cursor-pointer"
                        >
                          Return
                        </button>
                        <button
                          type="button"
                          onClick={() => updateTaskColumn(task._id, 'completed')}
                          className="rounded-md bg-emerald-400 px-2.5 py-1 text-[10px] font-semibold text-[#090b10] hover:bg-emerald-300 cursor-pointer"
                        >
                          Approve ✓
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between text-xs text-neutral-400">
                <span>Zero critical regressions open</span>
                <button
                  type="button"
                  onClick={onOpenNewTask}
                  className="font-medium text-amber-400 hover:text-amber-300 cursor-pointer"
                >
                  + Report Regression Bug →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =====================================================================
            INTERFACE 5: JORDAN BLAKE — PRODUCT MANAGER (role: 'guest')
           ===================================================================== */}
        {activePersonaRole === 'guest' && (
          <div className="mt-5 grid grid-cols-1 lg:grid-cols-12 gap-4 pt-4 border-t border-white/[0.07]">
            {/* Left 7 Cols: Quarterly Product OKRs & Feature Prioritization */}
            <div className="lg:col-span-7 rounded-xl border border-rose-500/25 bg-[#140b10] p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Workflow className="h-4 w-4 text-rose-400" />
                  <h3 className="text-xs font-semibold text-white">
                    Q4 Product Strategy OKRs & Customer Impact Roadmap
                  </h3>
                </div>
                <span className="font-mono text-[11px] text-rose-300">
                  {okrs.filter((o) => o.prioritized).length}/{okrs.length} P0 Locked
                </span>
              </div>

              <div className="space-y-2">
                {okrs.map((okr) => (
                  <div
                    key={okr.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 rounded-lg border border-white/[0.07] bg-[#1b0f16] px-3.5 py-2.5"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] text-rose-400">{okr.id}</span>
                        <span className="text-xs font-semibold text-white truncate">
                          {okr.objective}
                        </span>
                      </div>
                      <div className="mt-0.5 text-[11px] text-neutral-400">
                        Progress: <span className="font-mono text-emerald-400">{okr.metric}</span> ·{' '}
                        <span>{okr.confidence}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setOkrs((prev) =>
                          prev.map((item) =>
                            item.id === okr.id
                              ? { ...item, prioritized: !item.prioritized }
                              : item
                          )
                        )
                      }
                      className={`self-start sm:self-center flex-shrink-0 rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-colors cursor-pointer ${
                        okr.prioritized
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : 'bg-rose-500 text-white hover:bg-rose-400'
                      }`}
                    >
                      {okr.prioritized ? 'P0 Roadmap ✓' : 'Promote to P0'}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Right 5 Cols: Stakeholder Delivery & Release Readiness */}
            <div className="lg:col-span-5 rounded-xl border border-white/[0.08] bg-[#140b10] p-4 flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-rose-400" />
                  <h3 className="text-xs font-semibold text-white">
                    Initiative Delivery & Stakeholder Summary
                  </h3>
                </div>
                <span className="font-mono text-[11px] text-emerald-400">On Schedule</span>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="rounded-lg border border-white/[0.06] bg-[#1b0f16] p-3">
                  <div className="text-[10px] font-mono uppercase text-neutral-400">
                    Customer NPS
                  </div>
                  <div className="mt-1 font-mono text-lg font-bold text-white">+68</div>
                  <div className="text-[10px] text-emerald-400">↑ +6 pts vs Q3</div>
                </div>
                <div className="rounded-lg border border-white/[0.06] bg-[#1b0f16] p-3">
                  <div className="text-[10px] font-mono uppercase text-neutral-400">
                    Cycle Scope
                  </div>
                  <div className="mt-1 font-mono text-lg font-bold text-rose-300">
                    {tasks.length} Stories
                  </div>
                  <div className="text-[10px] text-neutral-400">
                    {tasks.filter((t) => t.column === 'completed').length} shipped to prod
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-neutral-400">
                <span>AI Sprint Planner ready for scoping</span>
                <button
                  type="button"
                  onClick={() => onNavigate('ai')}
                  className="font-medium text-rose-400 hover:text-rose-300 cursor-pointer"
                >
                  Open AI Story Planner →
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RoleWorkspaceDeck;
