import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Project, Task } from '../../context/ProjectContext';
import { User } from '../../context/AuthContext';
import { RoleThemeConfig } from '../../theme/roleTheme';
import {
  AnimatedRadialGauge,
  HeroConicFrame,
  RoleSurfaceCard,
  StaggerContainer,
  StaggerItem,
  useCountUp,
  FlowButton,
} from '../ui/RoleSharedUI';
import api from '../../services/api';
import {
  ShieldCheck,
  Check,
  X,
  Play,
  RotateCcw,
  Server,
  Activity,
  Lock,
  ArrowUpRight,
  Users,
  Terminal,
  Plus,
} from 'lucide-react';

export interface RoleCockpitProps {
  user: User | null;
  theme: RoleThemeConfig;
  projects: Project[];
  activeProject: Project | null;
  tasks: Task[];
  onNavigate: (route: string) => void;
  onOpenNewTask: () => void;
  onOpenNewProject: () => void;
  updateTaskColumn: (
    taskId: string,
    newColumn: 'backlog' | 'in_progress' | 'in_review' | 'completed'
  ) => Promise<void>;
  rejectTask: (taskId: string, reason: string, category?: string) => Promise<void>;
  approveTask: (taskId: string) => Promise<void>;
}

interface RfcItem {
  id: string;
  title: string;
  author: string;
  impact: string;
  targetIssue: string;
  status: 'pending' | 'approved' | 'rejected';
}

const INITIAL_RFCS: RfcItem[] = [
  {
    id: 'RFC-042',
    title: 'Multi-Region Active-Active Payment Failover Mesh',
    author: 'Priya Patel · Staff Backend Lead',
    impact: 'Sub-15ms cross-region failover · PAY-101',
    targetIssue: 'PAY-101',
    status: 'pending',
  },
  {
    id: 'RFC-045',
    title: 'Zero-Trust Asymmetric JWT Key Rotation & Audit Seal',
    author: 'Marcus Vance · Senior Engineer',
    impact: '90-day automated JWK rollover · PAY-103',
    targetIssue: 'PAY-103',
    status: 'pending',
  },
  {
    id: 'RFC-048',
    title: '3DS 2.0 Biometric Fallback Circuit Breaker',
    author: 'Sophia Laurent · QA Automation Lead',
    impact: '99.98% European issuer resiliency · PAY-102',
    targetIssue: 'PAY-102',
    status: 'approved',
  },
];

const TOPOLOGY_NODES = [
  {
    id: 'checkout',
    name: 'Checkout Engine',
    region: 'us-east-1 · Primary',
    latency: '11.4ms',
    rps: '14,820 req/s',
    x: 78,
    y: 56,
  },
  {
    id: 'mesh',
    name: '3DS Biometric Mesh',
    region: 'eu-central-1 · Edge',
    latency: '18.2ms',
    rps: '9,410 req/s',
    x: 270,
    y: 44,
  },
  {
    id: 'vault',
    name: 'Auth & JWT Vault',
    region: 'Global Anycast',
    latency: '4.1ms',
    rps: '28,900 req/s',
    x: 174,
    y: 138,
  },
];

const FAILOVER_STEPS = [
  '1. Draining us-east-1 ingress traffic via Envoy edge proxy...',
  '2. Promoting eu-central-1 PostgreSQL & Redis cluster to primary...',
  '3. Updating Global BGP Anycast routing table (0 packet loss)...',
  '4. Failover Drill Complete — 99.99% Multi-Region SLA verified in 1.4s.',
];

const RBAC_MATRIX = [
  {
    role: 'Principal Architect (Admin)',
    perms: [true, true, true, true, true],
  },
  {
    role: 'Staff Backend Lead',
    perms: [true, true, true, false, false],
  },
  {
    role: 'Senior Engineer (Dev)',
    perms: [false, false, true, false, false],
  },
  {
    role: 'QA Automation Lead',
    perms: [false, false, false, true, false],
  },
  {
    role: 'Product Manager (PM)',
    perms: [false, false, true, false, false],
  },
];

const RBAC_HEADERS = ['RFC Gov', 'Canary', 'Sprint', 'QA Gate', 'Audit/Imp'];

export const AdminDashboard: React.FC<RoleCockpitProps> = ({
  theme,
  tasks,
  projects,
  onNavigate,
  onOpenNewProject,
  onOpenNewTask,
}) => {
  const [rfcs, setRfcs] = useState<RfcItem[]>(() => {
    try {
      const saved = localStorage.getItem('pulsedev_admin_rfcs');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return INITIAL_RFCS;
  });
  const [selectedNodeId, setSelectedNodeId] = useState<string>('checkout');
  const [drillStep, setDrillStep] = useState<number>(-1);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  const completedCount = tasks.filter((t) => t.column === 'completed').length;
  const completionPct = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 75;
  const animatedCompletion = useCountUp(completionPct);
  const animatedIssues = useCountUp(tasks.length);

  useEffect(() => {
    api.auth
      .getAuditLogs()
      .then((res) => {
        if (res.success && Array.isArray(res.logs)) {
          setAuditLogs(res.logs.slice(0, 5));
        }
      })
      .catch(() => {});
  }, []);

  const handleRfcDecision = (id: string, decision: 'approved' | 'rejected') => {
    setRfcs((prev) => {
      const updated = prev.map((item) =>
        item.id === id ? { ...item, status: decision } : item
      );
      try {
        localStorage.setItem('pulsedev_admin_rfcs', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const runFailoverDrill = () => {
    if (drillStep >= 0 && drillStep < FAILOVER_STEPS.length - 1) return;
    setDrillStep(0);
    [1, 2, 3].forEach((stepIdx) => {
      setTimeout(() => {
        setDrillStep(stepIdx);
      }, stepIdx * 750);
    });
  };

  const activeNode =
    TOPOLOGY_NODES.find((n) => n.id === selectedNodeId) || TOPOLOGY_NODES[0];

  return (
    <StaggerContainer className="space-y-6">
      {/* HERO: System Architecture & Governance Command */}
      <StaggerItem>
        <HeroConicFrame theme={theme}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-white/[0.07] pb-4 mb-5">
            <div>
              <div className="flex items-center gap-2 text-xs text-emerald-400 font-mono">
                <ShieldCheck className="h-4 w-4" />
                <span>ARCHITECT COMMAND CENTER · GOVERNANCE & TOPOLOGY</span>
              </div>
              <h2 className="mt-1 text-lg sm:text-xl font-bold text-white tracking-tight">
                System Architecture & Governance Command
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <FlowButton
                text={
                  drillStep >= 0 && drillStep < 3
                    ? 'Simulating Failover...'
                    : 'Run Failover Drill'
                }
                size="sm"
                variant="accent"
                accentColor="#10B981"
                onClick={runFailoverDrill}
              />
              <FlowButton
                text="New Initiative"
                size="sm"
                variant="secondary"
                onClick={onOpenNewProject}
              />
              <FlowButton
                text="New Issue"
                size="sm"
                variant="primary"
                onClick={onOpenNewTask}
              />
            </div>
          </div>

          {/* Failover Drill Live Simulation Banner */}
          {drillStep >= 0 && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-xs"
            >
              <div className="flex items-center gap-2.5 font-mono text-emerald-200">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                <span>{FAILOVER_STEPS[drillStep]}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  {[0, 1, 2, 3].map((idx) => (
                    <span
                      key={idx}
                      className={`h-1.5 w-6 rounded-full transition-colors ${
                        idx <= drillStep ? 'bg-emerald-400' : 'bg-white/10'
                      }`}
                    />
                  ))}
                </div>
                {drillStep === 3 && (
                  <button
                    onClick={() => setDrillStep(-1)}
                    className="ml-2 text-neutral-400 hover:text-white cursor-pointer"
                    title="Reset simulation"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </motion.div>
          )}

          {/* Two-Column Hero Interior: Left = Animated Service Topology Map, Right = RFC Sign-Off Queue */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* LEFT: Animated Service Topology Map */}
            <div className="lg:col-span-6 flex flex-col justify-between rounded-xl border border-white/[0.07] bg-[#090c12] p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-neutral-200 flex items-center gap-1.5">
                  <Server className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Live Service Topology Mesh</span>
                </span>
                <span className="font-mono text-[11px] text-emerald-400">
                  {drillStep === 1 || drillStep === 2
                    ? 'REROUTING TRAFFIC'
                    : 'ALL NODES HEALTHY'}
                </span>
              </div>

              {/* Interactive SVG Topology Graph */}
              <div className="relative h-48 w-full overflow-hidden rounded-lg bg-[#07090e] border border-white/[0.04]">
                <svg
                  viewBox="0 0 360 185"
                  className="h-full w-full"
                  aria-label="Service topology map"
                >
                  <defs>
                    <linearGradient id="meshLineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#10B981" stopOpacity="0.25" />
                      <stop offset="50%" stopColor="#10B981" stopOpacity="0.95" />
                      <stop offset="100%" stopColor="#06B6D4" stopOpacity="0.3" />
                    </linearGradient>
                  </defs>

                  {/* Subtle technical grid */}
                  <pattern
                    id="archGrid"
                    width="24"
                    height="24"
                    patternUnits="userSpaceOnUse"
                  >
                    <path
                      d="M 24 0 L 0 0 0 24"
                      fill="none"
                      stroke="rgba(255,255,255,0.03)"
                      strokeWidth="1"
                    />
                  </pattern>
                  <rect width="360" height="185" fill="url(#archGrid)" />

                  {/* Animated glowing links between Checkout Engine (78,56), 3DS Mesh (270,44), and Auth Vault (174,138) */}
                  <line
                    x1="78"
                    y1="56"
                    x2="270"
                    y2="44"
                    stroke="rgba(16,185,129,0.2)"
                    strokeWidth="2"
                  />
                  <line
                    x1="78"
                    y1="56"
                    x2="270"
                    y2="44"
                    stroke="url(#meshLineGrad)"
                    strokeWidth="2.2"
                    strokeDasharray="6 6"
                    className=" topology-flow-line"
                  />

                  <line
                    x1="78"
                    y1="56"
                    x2="174"
                    y2="138"
                    stroke="rgba(16,185,129,0.2)"
                    strokeWidth="2"
                  />
                  <line
                    x1="78"
                    y1="56"
                    x2="174"
                    y2="138"
                    stroke="url(#meshLineGrad)"
                    strokeWidth="2.2"
                    strokeDasharray="6 6"
                    className="topology-flow-line"
                  />

                  <line
                    x1="270"
                    y1="44"
                    x2="174"
                    y2="138"
                    stroke="rgba(16,185,129,0.2)"
                    strokeWidth="2"
                  />
                  <line
                    x1="270"
                    y1="44"
                    x2="174"
                    y2="138"
                    stroke="url(#meshLineGrad)"
                    strokeWidth="2.2"
                    strokeDasharray="6 6"
                    className="topology-flow-line"
                  />

                  {/* Topology Nodes */}
                  {TOPOLOGY_NODES.map((node) => {
                    const isSelected = node.id === selectedNodeId;
                    return (
                      <g
                        key={node.id}
                        onClick={() => setSelectedNodeId(node.id)}
                        className="cursor-pointer"
                      >
                        <circle
                          cx={node.x}
                          cy={node.y}
                          r={isSelected ? 22 : 17}
                          fill="rgba(16, 185, 129, 0.12)"
                        />
                        <circle
                          cx={node.x}
                          cy={node.y}
                          r="12"
                          fill="#0d131c"
                          stroke={isSelected ? '#10B981' : 'rgba(255,255,255,0.25)'}
                          strokeWidth={isSelected ? '2.2' : '1.4'}
                        />
                        <circle
                          cx={node.x}
                          cy={node.y}
                          r="4.5"
                          fill="#10B981"
                        />
                        <text
                          x={node.x}
                          y={node.y + 26}
                          textAnchor="middle"
                          fill="#f3f5f8"
                          fontSize="10"
                          fontWeight="600"
                        >
                          {node.name}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>

              {/* Selected Node Telemetry Readout */}
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-white/[0.06] text-xs font-mono">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#10b981]" />
                  <span className="text-white font-semibold">{activeNode.name}</span>
                  <span className="text-neutral-500">·</span>
                  <span className="text-neutral-400">{activeNode.region}</span>
                </div>
                <div className="flex items-center gap-3 text-emerald-400">
                  <span>p99: {activeNode.latency}</span>
                  <span>·</span>
                  <span>{activeNode.rps}</span>
                </div>
              </div>
            </div>

            {/* RIGHT: RFC Sign-Off Queue with Approve / Reject Buttons */}
            <div className="lg:col-span-6 flex flex-col justify-between rounded-xl border border-white/[0.07] bg-[#090c12] p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-xs font-semibold text-white">
                    Architecture RFC Sign-Off Queue
                  </h3>
                  <p className="text-[11px] text-neutral-400">
                    Approve or reject production architecture proposals
                  </p>
                </div>
                <span className="font-mono text-xs text-emerald-400">
                  {rfcs.filter((r) => r.status === 'pending').length} pending
                </span>
              </div>

              <div className="space-y-2.5">
                {rfcs.map((rfc) => (
                  <div
                    key={rfc.id}
                    className="rounded-lg border border-white/[0.06] bg-[#0e121b] p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-mono font-semibold text-emerald-400">
                          {rfc.id}
                        </span>
                        <span className="text-neutral-600">·</span>
                        <span className="text-neutral-400 truncate">{rfc.author}</span>
                      </div>
                      <div className="text-xs font-semibold text-white truncate">
                        {rfc.title}
                      </div>
                      <div className="font-mono text-[11px] text-neutral-400">
                        {rfc.impact}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {rfc.status === 'pending' ? (
                        <>
                          <button
                            onClick={() => handleRfcDecision(rfc.id, 'approved')}
                            className="flex items-center gap-1 rounded-md bg-emerald-500/20 border border-emerald-500/40 px-2.5 py-1 text-[11px] font-semibold text-emerald-300 hover:bg-emerald-500/30 cursor-pointer"
                          >
                            <Check className="h-3 w-3" />
                            <span>Approve</span>
                          </button>
                          <button
                            onClick={() => handleRfcDecision(rfc.id, 'rejected')}
                            className="flex items-center gap-1 rounded-md bg-rose-500/15 border border-rose-500/30 px-2.5 py-1 text-[11px] font-medium text-rose-300 hover:bg-rose-500/25 cursor-pointer"
                          >
                            <X className="h-3 w-3" />
                            <span>Reject</span>
                          </button>
                        </>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-mono text-[11px] font-semibold uppercase ${
                              rfc.status === 'approved'
                                ? 'text-emerald-400'
                                : 'text-rose-400'
                            }`}
                          >
                            {rfc.status}
                          </span>
                          <button
                            onClick={() =>
                              setRfcs((prev) =>
                                prev.map((item) =>
                                  item.id === rfc.id ? { ...item, status: 'pending' } : item
                                )
                              )
                            }
                            className="text-[10px] text-neutral-500 hover:text-neutral-300 underline cursor-pointer"
                          >
                            Reset
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </HeroConicFrame>
      </StaggerItem>

      {/* ROW 2: Multi-Region SLA Gauges + System Velocity Metrics */}
      <StaggerItem className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <RoleSurfaceCard className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs text-neutral-400">US-East-1 Primary SLA</span>
            <div className="font-mono text-2xl font-bold text-white tabular-nums">
              99.99%
            </div>
            <p className="text-[11px] text-neutral-400 font-mono">
              p99: 11.4ms · 0 incidents
            </p>
          </div>
          <AnimatedRadialGauge
            value={100}
            color="#10B981"
            secondaryColor="#06B6D4"
            label="99.99%"
            sublabel="US-EAST"
          />
        </RoleSurfaceCard>

        <RoleSurfaceCard className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs text-neutral-400">EU-Central-1 Frankfurt SLA</span>
            <div className="font-mono text-2xl font-bold text-white tabular-nums">
              99.98%
            </div>
            <p className="text-[11px] text-neutral-400 font-mono">
              3DS PSD2 SCA Compliant
            </p>
          </div>
          <AnimatedRadialGauge
            value={99}
            color="#10B981"
            secondaryColor="#14B8A6"
            label="99.98%"
            sublabel="EU-CENT"
          />
        </RoleSurfaceCard>

        <RoleSurfaceCard className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs text-neutral-400">Global Sprint Delivery</span>
            <div className="font-mono text-2xl font-bold text-white tabular-nums">
              {animatedCompletion}%
            </div>
            <p className="text-[11px] text-neutral-400 font-mono">
              {completedCount} of {animatedIssues} issues · {projects.length} initiatives
            </p>
          </div>
          <AnimatedRadialGauge
            value={completionPct}
            color="#10B981"
            secondaryColor="#22D3EE"
            sublabel="CYCLE 44"
          />
        </RoleSurfaceCard>
      </StaggerItem>

      {/* ROW 3: RBAC Permission Heatmap & Live Security Audit / Impersonation Feed */}
      <StaggerItem className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* RBAC Permission Heatmap */}
        <RoleSurfaceCard className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
            <div>
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Lock className="h-4 w-4 text-emerald-400" />
                <span>RBAC Governance & Permission Heatmap</span>
              </h3>
              <p className="text-xs text-neutral-400 mt-0.5">
                Zero-trust role capabilities enforced by JWT middleware
              </p>
            </div>
            <button
              onClick={() => onNavigate('profile')}
              className="flex items-center gap-1 text-xs font-medium text-emerald-400 hover:text-emerald-300 cursor-pointer"
            >
              <Users className="h-3.5 w-3.5" />
              <span>Impersonate Member</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/[0.06] text-neutral-400 font-mono text-[11px]">
                  <th className="py-2 pr-3">Role Persona</th>
                  {RBAC_HEADERS.map((h) => (
                    <th key={h} className="py-2 px-2 text-center">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05]">
                {RBAC_MATRIX.map((row) => (
                  <tr key={row.role}>
                    <td className="py-2.5 pr-3 font-medium text-neutral-200">
                      {row.role}
                    </td>
                    {row.perms.map((allowed, idx) => (
                      <td key={idx} className="py-2.5 px-2 text-center">
                        <span
                          className={`inline-flex h-5 w-8 items-center justify-center rounded font-mono text-[10px] ${
                            allowed
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/35'
                              : 'bg-white/[0.03] text-neutral-600'
                          }`}
                        >
                          {allowed ? 'ALLOW' : '—'}
                        </span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </RoleSurfaceCard>

        {/* Live Audit & Sign-in Feed */}
        <RoleSurfaceCard className="lg:col-span-5 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
            <div>
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Terminal className="h-4 w-4 text-emerald-400" />
                <span>Live Security & Sign-In Stream</span>
              </h3>
              <p className="text-xs text-neutral-400 mt-0.5">
                Real-time JWT session & RBAC audit log
              </p>
            </div>
            <button
              onClick={() => onNavigate('admin-audit')}
              className="flex items-center gap-1 text-xs font-medium text-emerald-400 hover:text-emerald-300 cursor-pointer"
            >
              <span>Full Audit</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="space-y-2.5 flex-1">
            {(auditLogs.length > 0
              ? auditLogs
              : [
                  {
                    _id: 'a1',
                    action: 'USER_LOGIN',
                    performedByName: 'Alex Chen',
                    details: 'Principal Architect JWT verified (RS256)',
                    createdAt: new Date().toISOString(),
                  },
                  {
                    _id: 'a2',
                    action: 'RFC_APPROVE',
                    performedByName: 'Priya Patel',
                    details: 'Signed off RFC-048 3DS Fallback Circuit Breaker',
                    createdAt: new Date(Date.now() - 240000).toISOString(),
                  },
                  {
                    _id: 'a3',
                    action: 'TASK_MOVE',
                    performedByName: 'Marcus Vance',
                    details: 'Moved PAY-103 Webhook Queue to In Progress',
                    createdAt: new Date(Date.now() - 720000).toISOString(),
                  },
                ]
            ).map((log, i) => (
              <div
                key={log._id || i}
                className="rounded-lg border border-white/[0.05] bg-[#090c12] px-3 py-2 text-xs"
              >
                <div className="flex items-center justify-between font-mono text-[11px]">
                  <span className="text-emerald-400 font-semibold">{log.action}</span>
                  <span className="text-neutral-500">
                    {log.performedByName || 'System'}
                  </span>
                </div>
                <p className="mt-0.5 text-neutral-300 truncate">{log.details}</p>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-xs">
            <span className="text-neutral-400 flex items-center gap-1.5">
              <Activity className="h-3.5 w-3.5 text-emerald-400" />
              <span>Active Sprint Issues ({tasks.length})</span>
            </span>
            <button
              onClick={() => onNavigate('board')}
              className="font-semibold text-white hover:text-emerald-300 cursor-pointer"
            >
              Open Sprint Board →
            </button>
          </div>
        </RoleSurfaceCard>
      </StaggerItem>
    </StaggerContainer>
  );
};

export default AdminDashboard;
