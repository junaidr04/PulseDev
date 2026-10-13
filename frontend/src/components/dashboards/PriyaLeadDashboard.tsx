import React, { useState } from 'react';
import { motion } from 'motion/react';
import { RoleCockpitProps } from './AdminDashboard';
import {
  AnimatedSparkline,
  HeroConicFrame,
  RoleSurfaceCard,
  StaggerContainer,
  StaggerItem,
  useCountUp,
  FlowButton,
} from '../ui/RoleSharedUI';
import {
  GitPullRequest,
  Check,
  RotateCcw,
  Activity,
  Database,
  Radio,
  Rocket,
  Terminal,
  Plus,
  ArrowRight,
} from 'lucide-react';

interface PullRequestItem {
  id: string;
  number: string;
  title: string;
  author: string;
  branch: string;
  issueKey: string;
  additions: number;
  deletions: number;
  status: 'needs_review' | 'approved' | 'changes_requested';
}

const INITIAL_PRS: PullRequestItem[] = [
  {
    id: 'pr-1',
    number: 'PR #418',
    title: 'feat(webhooks): exponential backoff outbox with Redis streams',
    author: 'Marcus Vance',
    branch: 'feat/pay-103-webhook-backoff',
    issueKey: 'PAY-103',
    additions: 342,
    deletions: 48,
    status: 'needs_review',
  },
  {
    id: 'pr-2',
    number: 'PR #419',
    title: 'perf(mongo): compound index { projectId: 1, column: 1, priority: 1 }',
    author: 'Marcus Vance',
    branch: 'perf/pay-104-compound-index',
    issueKey: 'PAY-104',
    additions: 118,
    deletions: 19,
    status: 'needs_review',
  },
  {
    id: 'pr-3',
    number: 'PR #415',
    title: 'fix(wallet): Apple Pay & Google Pay session token idempotency key',
    author: 'Sophia Laurent',
    branch: 'fix/pay-102-wallet-token',
    issueKey: 'PAY-102',
    additions: 86,
    deletions: 14,
    status: 'approved',
  },
];

const SERVICE_SPARKLINES = [
  {
    name: 'payment-gateway-v2',
    p99: '14.2ms',
    errRate: '0.01%',
    rps: '12.4k/s',
    points: [18, 16, 15, 19, 14, 15, 13, 14],
    color: '#A78BFA',
  },
  {
    name: 'webhook-dispatcher',
    p99: '22.8ms',
    errRate: '0.03%',
    rps: '6.8k/s',
    points: [28, 31, 25, 24, 26, 22, 23, 21],
    color: '#818CF8',
  },
  {
    name: 'fraud-scorer-grpc',
    p99: '6.4ms',
    errRate: '0.00%',
    rps: '19.1k/s',
    points: [8, 7, 9, 7, 6, 7, 6, 6],
    color: '#C084FC',
  },
];

const PIPELINE_STEPS = [
  { id: 0, label: 'Build Image', detail: 'sha256:9f82d1a · 42s' },
  { id: 1, label: 'Integration Suite', detail: '418 / 418 specs passed' },
  { id: 2, label: 'Canary 25%', detail: 'us-east-1 · 0 errors' },
  { id: 3, label: 'Prod Rollout', detail: 'Global fleet active' },
];

export const PriyaLeadDashboard: React.FC<RoleCockpitProps> = ({
  theme,
  tasks,
  onNavigate,
  onOpenNewTask,
  onOpenNewProject,
  updateTaskColumn,
}) => {
  const [prs, setPrs] = useState<PullRequestItem[]>(() => {
    try {
      const saved = localStorage.getItem('pulsedev_lead_prs');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return INITIAL_PRS;
  });
  const [pipelineStage, setPipelineStage] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('pulsedev_lead_pipeline_stage');
      if (saved) return Number(saved);
    } catch {}
    return 2;
  });
  const [promoting, setPromoting] = useState<boolean>(false);

  const inReviewTasks = tasks.filter((t) => t.column === 'in_review');
  const queueDepth = useCountUp(142);
  const replicationLagMs = useCountUp(4);

  const handlePrAction = (id: string, nextStatus: PullRequestItem['status']) => {
    setPrs((prev) => {
      const updated = prev.map((pr) =>
        pr.id === id ? { ...pr, status: nextStatus } : pr
      );
      try {
        localStorage.setItem('pulsedev_lead_prs', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const handlePromoteCanary = () => {
    if (pipelineStage >= 3) {
      setPipelineStage(2);
      return;
    }
    setPromoting(true);
    setTimeout(() => {
      setPipelineStage(3);
      setPromoting(false);
    }, 650);
  };

  return (
    <StaggerContainer className="space-y-6">
      {/* HERO: Deployment Pipeline Stepper + Backend Service Telemetry Header */}
      <StaggerItem>
        <HeroConicFrame theme={theme}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-white/[0.07] pb-4 mb-5">
            <div>
              <div className="flex items-center gap-2 font-mono text-xs text-violet-300">
                <Terminal className="h-4 w-4 text-violet-400" />
                <span>STAFF BACKEND LEAD · SERVICE HEALTH & CODE REVIEW HUB</span>
              </div>
              <h2 className="mt-1 text-lg sm:text-xl font-bold text-white tracking-tight">
                Release Pipeline & Distributed Backend Telemetry
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <FlowButton
                text={
                  promoting
                    ? 'Promoting Canary...'
                    : pipelineStage === 3
                    ? 'Reset Canary Stage'
                    : 'Promote Canary → Prod'
                }
                size="sm"
                variant="accent"
                accentColor="#A78BFA"
                onClick={handlePromoteCanary}
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

          {/* Animated Deployment Pipeline Stepper (Build -> Test -> Canary -> Prod) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-neutral-300">
                PIPELINE: <strong className="text-white">pay-engine-v2.14.0</strong>
              </span>
              <span className="text-violet-300">
                {pipelineStage === 3 ? '100% PRODUCTION LIVE' : 'STAGE 3/4 · CANARY VERIFIED'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              {PIPELINE_STEPS.map((step, idx) => {
                const isDone = idx < pipelineStage || pipelineStage === 3;
                const isCurrent = idx === pipelineStage && pipelineStage < 3;
                return (
                  <div
                    key={step.id}
                    className={`rounded-xl border p-3.5 transition-all ${
                      isCurrent
                        ? 'border-violet-400/50 bg-violet-500/12 shadow-[0_0_25px_rgba(167,139,250,0.15)]'
                        : isDone
                        ? 'border-white/[0.1] bg-[#101420]'
                        : 'border-white/[0.05] bg-[#090c12] opacity-65'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-mono mb-1">
                      <span className="text-violet-300 font-semibold">
                        0{idx + 1}. {step.label}
                      </span>
                      {isDone ? (
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                      ) : isCurrent ? (
                        <span className="h-2 w-2 rounded-full bg-violet-400 animate-ping" />
                      ) : null}
                    </div>
                    <div className="font-mono text-[11px] text-neutral-400">
                      {step.detail}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Smooth Animated Progress Bar */}
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
              <motion.div
                initial={{ width: '0%' }}
                animate={{ width: pipelineStage === 3 ? '100%' : '75%' }}
                transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
                className="h-full rounded-full bg-gradient-to-r from-violet-400 via-purple-400 to-indigo-400"
              />
            </div>
          </div>
        </HeroConicFrame>
      </StaggerItem>

      {/* TWO-COLUMN CORE LAYOUT: Left = PR / Code Review Queue; Right = API Latency Sparklines + Queue Depth + DB Lag */}
      <StaggerItem className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN (7 cols): PR / Code Review Queue + Needs My Review */}
        <div className="lg:col-span-7 space-y-5">
          <RoleSurfaceCard className="space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
              <div>
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <GitPullRequest className="h-4 w-4 text-violet-400" />
                  <span>Needs My Review — Pull Request Queue</span>
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Backend architecture & database index PRs awaiting Staff Lead sign-off
                </p>
              </div>
              <span className="font-mono text-xs text-violet-300">
                {prs.filter((p) => p.status === 'needs_review').length} awaiting review
              </span>
            </div>

            <div className="space-y-3">
              {prs.map((pr) => (
                <div
                  key={pr.id}
                  className="rounded-xl border border-white/[0.07] bg-[#0a0d14] p-4 space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                    <div className="flex items-center gap-2">
                      <span className="text-violet-400 font-semibold">{pr.number}</span>
                      <span className="text-neutral-600">·</span>
                      <span className="text-neutral-300">{pr.issueKey}</span>
                      <span className="text-neutral-600">·</span>
                      <span className="text-neutral-400">{pr.author}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-400">+{pr.additions}</span>
                      <span className="text-rose-400">-{pr.deletions}</span>
                    </div>
                  </div>

                  <div>
                    <div className="text-sm font-semibold text-white">{pr.title}</div>
                    <div className="mt-1 font-mono text-[11px] text-neutral-400">
                      branch: {pr.branch}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/[0.05]">
                    <span
                      className={`font-mono text-[11px] font-semibold ${
                        pr.status === 'approved'
                          ? 'text-emerald-400'
                          : pr.status === 'changes_requested'
                          ? 'text-amber-400'
                          : 'text-violet-300'
                      }`}
                    >
                      STATUS: {pr.status.replace('_', ' ').toUpperCase()}
                    </span>

                    <div className="flex items-center gap-2">
                      {pr.status === 'needs_review' ? (
                        <>
                          <button
                            onClick={() => handlePrAction(pr.id, 'approved')}
                            className="flex items-center gap-1 rounded-lg bg-violet-500/20 border border-violet-400/40 px-2.5 py-1 text-xs font-semibold text-violet-200 hover:bg-violet-500/30 cursor-pointer"
                          >
                            <Check className="h-3 w-3" />
                            <span>Approve & Merge</span>
                          </button>
                          <button
                            onClick={() => handlePrAction(pr.id, 'changes_requested')}
                            className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-xs text-neutral-300 hover:text-white cursor-pointer"
                          >
                            Request Changes
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => handlePrAction(pr.id, 'needs_review')}
                          className="flex items-center gap-1 text-xs text-neutral-400 hover:text-white cursor-pointer"
                        >
                          <RotateCcw className="h-3 w-3" />
                          <span>Re-open review</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Sprint Issues in Review Queue */}
            <div className="pt-3 border-t border-white/[0.06] space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-neutral-300">
                  Sprint Issues Ready for Backend Sign-Off ({inReviewTasks.length})
                </span>
                <button
                  onClick={() => onNavigate('board')}
                  className="font-mono text-violet-300 hover:text-violet-200 cursor-pointer flex items-center gap-1"
                >
                  <span>Sprint Board</span>
                  <ArrowRight className="h-3 w-3" />
                </button>
              </div>
              {inReviewTasks.map((t) => (
                <div
                  key={t._id}
                  className="flex items-center justify-between rounded-lg border border-white/[0.05] bg-[#090c12] px-3 py-2 text-xs"
                >
                  <div className="truncate pr-3">
                    <span className="font-medium text-white">{t.title}</span>
                    <span className="ml-2 text-neutral-500 font-mono">
                      ({t.assignee?.name || 'Priya Patel'})
                    </span>
                  </div>
                  <button
                    onClick={() => updateTaskColumn(t._id, 'completed')}
                    className="rounded bg-violet-500/20 px-2.5 py-1 font-mono text-[11px] text-violet-200 hover:bg-violet-500/35 cursor-pointer flex-shrink-0"
                  >
                    Ship →
                  </button>
                </div>
              ))}
            </div>
          </RoleSurfaceCard>
        </div>

        {/* RIGHT COLUMN (5 cols): Service Latency Sparklines + Webhook Queue Depth + DB Replication + On-Call */}
        <div className="lg:col-span-5 space-y-5">
          {/* API Latency + Error-Rate Sparklines per Service */}
          <RoleSurfaceCard className="space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
              <div>
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Activity className="h-4 w-4 text-violet-400" />
                  <span>Microservice Latency & Error Telemetry</span>
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Real-time gRPC & REST p99 response curves
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {SERVICE_SPARKLINES.map((svc) => (
                <div
                  key={svc.name}
                  className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-[#0a0d14] p-3"
                >
                  <div className="min-w-0">
                    <div className="font-mono text-xs font-semibold text-white truncate">
                      {svc.name}
                    </div>
                    <div className="mt-1 flex items-center gap-2 font-mono text-[11px] text-neutral-400">
                      <span className="text-violet-300">p99: {svc.p99}</span>
                      <span>·</span>
                      <span>err: {svc.errRate}</span>
                      <span>·</span>
                      <span>{svc.rps}</span>
                    </div>
                  </div>
                  <AnimatedSparkline
                    points={svc.points}
                    color={svc.color}
                    width={108}
                    height={30}
                  />
                </div>
              ))}
            </div>
          </RoleSurfaceCard>

          {/* Webhook Queue Depth & DB Replication Lag */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <RoleSurfaceCard className="space-y-2">
              <div className="flex items-center justify-between text-xs text-neutral-400">
                <span>Webhook Queue Depth</span>
                <Database className="h-3.5 w-3.5 text-violet-400" />
              </div>
              <div className="font-mono text-2xl font-bold text-white tabular-nums">
                {queueDepth} <span className="text-xs font-normal text-neutral-400">msgs</span>
              </div>
              <div className="font-mono text-[11px] text-emerald-400">
                Drain rate: 1,840/sec · Healthy
              </div>
            </RoleSurfaceCard>

            <RoleSurfaceCard className="space-y-2">
              <div className="flex items-center justify-between text-xs text-neutral-400">
                <span>DB Replication Lag</span>
                <Activity className="h-3.5 w-3.5 text-violet-400" />
              </div>
              <div className="font-mono text-2xl font-bold text-white tabular-nums">
                0.{replicationLagMs}ms
              </div>
              <div className="font-mono text-[11px] text-violet-300">
                Primary → 3 Read Replicas synced
              </div>
            </RoleSurfaceCard>
          </div>

          {/* On-Call Rotation Card */}
          <RoleSurfaceCard className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-white">
                <Radio className="h-4 w-4 text-violet-400 animate-pulse" />
                <span>Backend On-Call Rotation (Tier-1 Core)</span>
              </div>
              <span className="font-mono text-[11px] text-emerald-400">
                0 Pager Alerts
              </span>
            </div>

            <div className="rounded-xl border border-white/[0.06] bg-[#0a0d14] p-3 flex items-center justify-between text-xs">
              <div>
                <div className="text-neutral-400">Primary Responder</div>
                <div className="font-semibold text-white mt-0.5">
                  Priya Patel (Staff Backend Lead)
                </div>
              </div>
              <div className="text-right font-mono text-[11px]">
                <div className="text-violet-300">SLA &lt; 3m</div>
                <div className="text-neutral-500">Backup: Marcus Vance</div>
              </div>
            </div>
          </RoleSurfaceCard>
        </div>
      </StaggerItem>
    </StaggerContainer>
  );
};

export default PriyaLeadDashboard;
