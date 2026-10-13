import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RoleCockpitProps } from './AdminDashboard';
import {
  AnimatedRadialGauge,
  AnimatedSparkline,
  HeroConicFrame,
  RoleSurfaceCard,
  StaggerContainer,
  StaggerItem,
  FlowButton,
} from '../ui/RoleSharedUI';
import {
  ShieldAlert,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Bug,
  CheckSquare,
  Square,
  Play,
  Plus,
  X,
  AlertTriangle,
  FileCode2,
  Check,
  Flame,
  Clock,
  Sparkles,
} from 'lucide-react';

export interface QaPipelineCard {
  id: string;
  taskId?: string;
  code: string;
  title: string;
  author: string;
  authorInitials: string;
  stage: 'ready' | 'testing' | 'passed' | 'failed';
  severity: 'blocker' | 'critical' | 'major' | 'minor';
  rejectionReason?: string;
  rejectionCategory?: string;
}

interface FlakySpecItem {
  id: string;
  spec: string;
  flakeRate: string;
  sparkline: number[];
  browser: 'Chromium' | 'WebKit' | 'Firefox';
  status: 'active' | 'quarantined';
}

interface RegressionCheck {
  id: string;
  label: string;
  targetIssue: string;
  checked: boolean;
}

const INITIAL_FLAKY_SPECS: FlakySpecItem[] = [
  {
    id: 'flaky-1',
    spec: 'e2e/checkout-3ds-biometric-timeout.spec.ts',
    flakeRate: '4.2% flake',
    sparkline: [20, 45, 10, 80, 25, 60, 40],
    browser: 'Chromium',
    status: 'active',
  },
  {
    id: 'flaky-2',
    spec: 'integration/webhook-exponential-jitter.spec.ts',
    flakeRate: '2.1% flake',
    sparkline: [10, 15, 60, 20, 30, 40, 20],
    browser: 'Firefox',
    status: 'active',
  },
  {
    id: 'flaky-3',
    spec: 'e2e/apple-pay-sheet-safari-webkit.spec.ts',
    flakeRate: '0.0% stable',
    sparkline: [0, 5, 0, 0, 10, 0, 0],
    browser: 'WebKit',
    status: 'quarantined',
  },
];

const INITIAL_REGRESSION_CHECKS: RegressionCheck[] = [
  {
    id: 'reg-1',
    label: 'Verify 3DS 2.0 challenge fallback to SMS OTP on European card BINs',
    targetIssue: 'PAY-101',
    checked: false,
  },
  {
    id: 'reg-2',
    label: 'Validate idempotency key collision resilience under concurrent burst charges',
    targetIssue: 'PAY-102',
    checked: false,
  },
  {
    id: 'reg-3',
    label: 'Confirm dead-letter queue alerts fire after 5 failed webhook retries',
    targetIssue: 'PAY-103',
    checked: false,
  },
  {
    id: 'reg-4',
    label: 'Audit WCAG AA focus rings & keyboard navigation across modal checkout sheet',
    targetIssue: 'PAY-105',
    checked: false,
  },
  {
    id: 'reg-5',
    label: 'Verify cryptographic replay prevention on OAuth JWT token refresh endpoints',
    targetIssue: 'PAY-106',
    checked: false,
  },
];

export const QADashboard: React.FC<RoleCockpitProps> = ({
  theme,
  tasks,
  activeProject,
  onOpenNewTask,
  updateTaskColumn,
}) => {
  const projectKey = activeProject?.key || 'PAY';

  // Populate QA Cards from tasks or project issues cleanly
  const [qaCards, setQaCards] = useState<QaPipelineCard[]>(() => {
    if (tasks && tasks.length > 0) {
      return tasks.slice(0, 6).map((t, idx) => {
        const stageMap: Record<string, QaPipelineCard['stage']> = {
          todo: 'ready',
          in_progress: 'testing',
          in_review: 'ready',
          completed: 'passed',
        };
        const sevList: QaPipelineCard['severity'][] = ['critical', 'major', 'minor', 'blocker'];
        return {
          id: `qa-${t._id || idx}`,
          taskId: t._id,
          code: `${projectKey}-${100 + idx + 1}`,
          title: t.title,
          author: t.assignee?.name || 'PulseDev Engineer',
          authorInitials: (t.assignee?.name || 'PE')
            .split(' ')
            .map((n) => n[0])
            .join('')
            .slice(0, 2)
            .toUpperCase(),
          stage: stageMap[t.column] || (idx === 0 ? 'ready' : idx === 1 ? 'testing' : 'passed'),
          severity: sevList[idx % sevList.length],
        };
      });
    }

    return [
      {
        id: 'qa-1',
        code: `${projectKey}-102`,
        title: 'Apple Pay & Google Pay One-Click Wallet Integration',
        author: 'Priya Patel',
        authorInitials: 'PP',
        stage: 'ready',
        severity: 'critical',
      },
      {
        id: 'qa-2',
        code: `${projectKey}-103`,
        title: 'Payment Webhook Delivery Queue with Exponential Backoff',
        author: 'Marcus Vance',
        authorInitials: 'MV',
        stage: 'testing',
        severity: 'major',
      },
      {
        id: 'qa-3',
        code: `${projectKey}-101`,
        title: 'Implement 3D Secure 2.0 Biometric Verification Flow',
        author: 'Alex Chen',
        authorInitials: 'AC',
        stage: 'passed',
        severity: 'blocker',
      },
    ];
  });

  // Rejection Modal State
  const [rejectModalCard, setRejectModalCard] = useState<QaPipelineCard | null>(null);
  const [rejectCategory, setRejectCategory] = useState<'functional' | 'regression' | 'performance' | 'flaky'>('functional');
  const [rejectSeverity, setRejectSeverity] = useState<'blocker' | 'critical' | 'major' | 'minor'>('critical');
  const [rejectReason, setRejectReason] = useState<string>('');

  // Flaky specs and Regression Checklist with localStorage persistence
  const [flakySpecs, setFlakySpecs] = useState<FlakySpecItem[]>(() => {
    try {
      const saved = localStorage.getItem('pulsedev_qa_flaky_specs');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return INITIAL_FLAKY_SPECS;
  });

  const [regressionList, setRegressionList] = useState<RegressionCheck[]>(() => {
    try {
      const saved = localStorage.getItem('pulsedev_qa_regression_list');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return INITIAL_REGRESSION_CHECKS;
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Keep QA Cards synchronized with live tasks state from database & ProjectContext
  React.useEffect(() => {
    if (tasks && tasks.length > 0) {
      setQaCards((prev) => {
        const stageMap: Record<string, QaPipelineCard['stage']> = {
          backlog: 'ready',
          todo: 'ready',
          in_progress: 'testing',
          in_review: 'ready',
          completed: 'passed',
        };
        const sevList: QaPipelineCard['severity'][] = ['critical', 'major', 'minor', 'blocker'];

        // Retrieve saved custom decisions for QA cards from localStorage
        let savedCardStates: Record<string, any> = {};
        try {
          const raw = localStorage.getItem('pulsedev_qa_card_overrides');
          if (raw) savedCardStates = JSON.parse(raw);
        } catch {}

        return tasks.slice(0, 8).map((t, idx) => {
          const cardId = `qa-${t._id || idx}`;
          const existing = prev.find((c) => c.taskId === t._id || c.id === cardId);
          const override = savedCardStates[t._id] || savedCardStates[cardId];
          const derivedStage = stageMap[t.column] || 'ready';

          const finalStage =
            t.column === 'completed'
              ? 'passed'
              : override?.stage || (existing?.stage && existing.taskId === t._id ? existing.stage : derivedStage);

          return {
            id: cardId,
            taskId: t._id,
            code: `${projectKey}-${100 + idx + 1}`,
            title: t.title,
            author: t.assignee?.name || 'PulseDev Engineer',
            authorInitials: (t.assignee?.name || 'PE')
              .split(' ')
              .map((n) => n[0])
              .join('')
              .slice(0, 2)
              .toUpperCase(),
            stage: finalStage,
            severity: override?.severity || existing?.severity || sevList[idx % sevList.length],
            rejectionCategory: override?.rejectionCategory || existing?.rejectionCategory,
            rejectionReason: override?.rejectionReason || existing?.rejectionReason,
          };
        });
      });
    }
  }, [tasks, projectKey]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  const saveQaOverride = (cardId: string, taskId: string | undefined, data: any) => {
    try {
      const raw = localStorage.getItem('pulsedev_qa_card_overrides');
      const obj = raw ? JSON.parse(raw) : {};
      if (taskId) obj[taskId] = data;
      obj[cardId] = data;
      localStorage.setItem('pulsedev_qa_card_overrides', JSON.stringify(obj));
    } catch {}
  };

  const handlePassCard = async (card: QaPipelineCard) => {
    setQaCards((prev) =>
      prev.map((c) =>
        c.id === card.id ? { ...c, stage: 'passed', rejectionReason: undefined } : c
      )
    );
    saveQaOverride(card.id, card.taskId, { stage: 'passed' });
    if (card.taskId) {
      await updateTaskColumn(card.taskId, 'completed');
    }
    showToast(`Passed QA verification: ${card.code}`);
  };

  const handleStartTesting = (card: QaPipelineCard) => {
    setQaCards((prev) =>
      prev.map((c) => (c.id === card.id ? { ...c, stage: 'testing' } : c))
    );
    saveQaOverride(card.id, card.taskId, { stage: 'testing' });
    showToast(`Moved ${card.code} to Lab Testing`);
  };

  const handleOpenRejectModal = (card: QaPipelineCard) => {
    setRejectModalCard(card);
    setRejectReason('');
  };

  const handleConfirmReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectModalCard || !rejectReason.trim()) return;

    const rejectData = {
      stage: 'failed' as const,
      severity: rejectSeverity,
      rejectionCategory: rejectCategory,
      rejectionReason: rejectReason.trim(),
    };

    setQaCards((prev) =>
      prev.map((c) =>
        c.id === rejectModalCard.id ? { ...c, ...rejectData } : c
      )
    );

    saveQaOverride(rejectModalCard.id, rejectModalCard.taskId, rejectData);

    if (rejectModalCard.taskId) {
      await updateTaskColumn(rejectModalCard.taskId, 'in_progress');
    }

    showToast(`Rejected ${rejectModalCard.code} with ${rejectCategory} issue`);
    setRejectModalCard(null);
    setRejectReason('');
  };

  const toggleFlakyQuarantine = (id: string) => {
    setFlakySpecs((prev) => {
      const updated = prev.map((item) =>
        item.id === id
          ? { ...item, status: item.status === 'active' ? ('quarantined' as const) : ('active' as const) }
          : item
      );
      try {
        localStorage.setItem('pulsedev_qa_flaky_specs', JSON.stringify(updated));
      } catch {}
      return updated;
    });
    showToast('Toggled quarantine status');
  };

  const toggleRegressionCheck = (id: string) => {
    setRegressionList((prev) => {
      const updated = prev.map((item) =>
        item.id === id ? { ...item, checked: !item.checked } : item
      );
      try {
        localStorage.setItem('pulsedev_qa_regression_list', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const passedCount = qaCards.filter((c) => c.stage === 'passed').length;
  const failedCount = qaCards.filter((c) => c.stage === 'failed').length;
  const testingCount = qaCards.filter((c) => c.stage === 'testing').length;
  const readyCount = qaCards.filter((c) => c.stage === 'ready').length;

  const totalChecks = regressionList.length;
  const completedChecks = regressionList.filter((r) => r.checked).length;
  const allChecksPassed = completedChecks === totalChecks && totalChecks > 0;

  const stages: Array<{ key: QaPipelineCard['stage']; label: string; count: number }> = [
    { key: 'ready', label: 'Ready for QA', count: readyCount },
    { key: 'testing', label: 'Testing in Lab', count: testingCount },
    { key: 'passed', label: 'Passed / Verified', count: passedCount },
    { key: 'failed', label: 'Rejected', count: failedCount },
  ];

  return (
    <StaggerContainer className="space-y-6">
      {/* Toast notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl border border-amber-500/40 bg-[#121620] px-4 py-2.5 text-xs font-medium text-amber-300 shadow-2xl animate-in fade-in slide-in-from-bottom-2">
          <Sparkles className="h-4 w-4 text-amber-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* HERO: Quality Gate Lab Pipeline */}
      <StaggerItem>
        <HeroConicFrame theme={theme}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-white/[0.07] pb-4 mb-5">
            <div>
              <div className="flex items-center gap-2 font-mono text-xs text-amber-400">
                <ShieldAlert className="h-4 w-4" />
                <span>QUALITY GATE LAB · VERIFICATION PIPELINE</span>
              </div>
              <h2 className="mt-1 text-lg sm:text-xl font-bold text-white tracking-tight">
                Sprint Issues QA Gate — Ready, In-Testing, Passed & Rejected
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <FlowButton
                text="Log QA Issue"
                size="sm"
                variant="accent"
                accentColor="#FBBF24"
                onClick={onOpenNewTask}
              />
            </div>
          </div>

          {/* 4-Stage Kanban QA Pipeline */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {stages.map((col) => {
              const colCards = qaCards.filter((c) => c.stage === col.key);

              return (
                <div
                  key={col.key}
                  className="rounded-xl border border-white/[0.06] bg-[#080b11]/80 p-3.5 space-y-3"
                >
                  <div className="flex items-center justify-between border-b border-white/[0.05] pb-2">
                    <span className="font-mono text-xs font-semibold text-neutral-300">
                      {col.label}
                    </span>
                    <span className="rounded-full bg-white/[0.08] px-2 py-0.5 font-mono text-[10px] text-neutral-400">
                      {col.count}
                    </span>
                  </div>

                  <div className="space-y-3 min-h-[160px]">
                    {colCards.length === 0 ? (
                      <div className="flex h-32 items-center justify-center rounded-lg border border-dashed border-white/[0.06] text-[11px] text-neutral-500 font-mono">
                        No issues in this stage
                      </div>
                    ) : (
                      colCards.map((card) => (
                        <div
                          key={card.id}
                          className="relative rounded-xl border border-white/[0.08] bg-[#0e121a] p-3.5 space-y-2.5 transition-all hover:border-amber-400/40"
                        >
                          {/* Animated Status Stamps */}
                          {card.stage === 'passed' && (
                            <motion.div
                              initial={{ scale: 2, opacity: 0, rotate: -15 }}
                              animate={{ scale: 1, opacity: 1, rotate: -6 }}
                              transition={{ type: 'spring', damping: 15 }}
                              className="absolute top-3 right-3 pointer-events-none rounded border-2 border-emerald-400/80 bg-emerald-500/20 px-2 py-0.5 text-[10px] font-mono font-extrabold tracking-widest text-emerald-300 shadow-lg select-none"
                            >
                              PASSED QA
                            </motion.div>
                          )}

                          {card.stage === 'failed' && (
                            <motion.div
                              initial={{ scale: 0.9, opacity: 0, rotate: -3 }}
                              animate={{ scale: 1, opacity: 1, rotate: -3 }}
                              transition={{ duration: 0.22, ease: 'easeOut' }}
                              className="pointer-events-none w-fit rounded border border-rose-500/80 bg-rose-500/10 px-1.5 py-0.5 text-[9px] font-mono font-extrabold tracking-wider text-rose-300 select-none"
                            >
                              REJECTED
                            </motion.div>
                          )}

                          <div className="flex items-center justify-between text-xs font-mono">
                            <span className="text-amber-400 font-bold">{card.code}</span>
                            <span
                              className={`rounded px-1.5 py-0.5 text-[10px] uppercase font-bold ${
                                card.severity === 'blocker'
                                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                  : card.severity === 'critical'
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                  : 'bg-neutral-800 text-neutral-300'
                              }`}
                            >
                              {card.severity}
                            </span>
                          </div>

                          <h4 className="text-xs font-medium text-white line-clamp-2">
                            {card.title}
                          </h4>

                          <div className="flex items-center justify-between text-[11px] text-neutral-400 pt-1 border-t border-white/[0.04]">
                            <div className="flex items-center gap-1.5">
                              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/[0.08] font-mono text-[9px] text-white">
                                {card.authorInitials}
                              </span>
                              <span className="truncate max-w-[90px]">{card.author}</span>
                            </div>
                          </div>

                          {/* Rejection Details if Failed */}
                          {card.rejectionReason && (
                            <div className="rounded-lg bg-rose-500/10 border border-rose-500/20 p-2 text-[11px] text-rose-300 space-y-1">
                              <div className="font-semibold uppercase tracking-wider text-[9px] text-rose-400">
                                {card.rejectionCategory || 'Defect'} Reason:
                              </div>
                              <p className="line-clamp-2">{card.rejectionReason}</p>
                            </div>
                          )}

                          {/* Action Buttons */}
                          <div className="flex items-center gap-2 pt-1">
                            {card.stage === 'ready' && (
                              <button
                                onClick={() => handleStartTesting(card)}
                                className="w-full flex items-center justify-center gap-1 rounded-lg bg-amber-400/15 border border-amber-400/30 py-1 text-[11px] font-semibold text-amber-300 hover:bg-amber-400/25 transition-colors cursor-pointer"
                              >
                                <Play className="h-3 w-3" />
                                <span>Start Testing</span>
                              </button>
                            )}

                            {card.stage === 'testing' && (
                              <>
                                <button
                                  onClick={() => handlePassCard(card)}
                                  className="flex-1 rounded-lg bg-emerald-500/20 border border-emerald-500/40 py-1 text-[11px] font-semibold text-emerald-300 hover:bg-emerald-500/30 transition-colors cursor-pointer"
                                >
                                  Pass QA
                                </button>
                                <button
                                  onClick={() => handleOpenRejectModal(card)}
                                  className="flex-1 rounded-lg bg-rose-500/15 border border-rose-500/35 py-1 text-[11px] font-semibold text-rose-300 hover:bg-rose-500/25 transition-colors cursor-pointer"
                                >
                                  Reject
                                </button>
                              </>
                            )}

                            {(card.stage === 'passed' || card.stage === 'failed') && (
                              <button
                                onClick={() => handleStartTesting(card)}
                                className="flex items-center gap-1 text-[11px] text-neutral-400 hover:text-white transition-colors cursor-pointer"
                              >
                                <RotateCcw className="h-3 w-3" />
                                <span>Re-test issue</span>
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </HeroConicFrame>
      </StaggerItem>

      {/* LOWER SECTION: Pass Rate Donut, Bug Severity, Flaky Specs, Regression Checklist */}
      <StaggerItem className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Pass Rate Gauge & Bug Breakdown */}
        <RoleSurfaceCard className="lg:col-span-4 space-y-5">
          <div className="flex items-center justify-between gap-4 border-b border-white/[0.06] pb-4">
            <div>
              <span className="text-xs text-neutral-400 font-mono">Automated Spec Pass Rate</span>
              <div className="font-mono text-2xl font-bold text-white tabular-nums">
                94.2%
              </div>
              <p className="font-mono text-[11px] text-emerald-400 mt-0.5">
                418 specs verified · 0 critical leaks
              </p>
            </div>
            <AnimatedRadialGauge
              value={94}
              size={80}
              strokeWidth={7}
              color="#FBBF24"
              secondaryColor="#10B981"
              label="94%"
              sublabel="PASS"
            />
          </div>

          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-white flex items-center gap-1.5">
                <Bug className="h-3.5 w-3.5 text-amber-400" />
                <span>Bug Severity Breakdown</span>
              </span>
              <span className="font-mono text-[11px] text-neutral-400">Current Sprint</span>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div>
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className="text-rose-400 font-medium">Critical (S1)</span>
                  <span className="text-neutral-400">1 open (12%)</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-white/[0.06] overflow-hidden">
                  <div className="h-full bg-rose-500 rounded-full" style={{ width: '12%' }} />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className="text-amber-400 font-medium">Major (S2)</span>
                  <span className="text-neutral-400">2 open (25%)</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-white/[0.06] overflow-hidden">
                  <div className="h-full bg-amber-400 rounded-full" style={{ width: '25%' }} />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className="text-neutral-400 font-medium">Minor (S3)</span>
                  <span className="text-neutral-400">5 open (63%)</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-white/[0.06] overflow-hidden">
                  <div className="h-full bg-neutral-400 rounded-full" style={{ width: '63%' }} />
                </div>
              </div>
            </div>
          </div>
        </RoleSurfaceCard>

        {/* Flaky-Test Watchlist */}
        <RoleSurfaceCard className="lg:col-span-4 space-y-4">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
            <div>
              <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
                <Flame className="h-4 w-4 text-amber-400" />
                <span>Flaky-Test Watchlist</span>
              </h3>
              <p className="text-[11px] text-neutral-400">
                Specs exhibiting variance across runs
              </p>
            </div>
          </div>

          <div className="space-y-2.5">
            {flakySpecs.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-white/[0.06] bg-[#080b11] p-3 space-y-2"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-neutral-200 truncate max-w-[180px] text-[11px]" title={item.spec}>
                    {item.spec}
                  </span>
                  <span
                    className={`rounded px-1.5 py-0.5 text-[10px] font-mono ${
                      item.status === 'quarantined'
                        ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                        : 'bg-amber-400/15 text-amber-300 border border-amber-400/30'
                    }`}
                  >
                    {item.status}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-neutral-400 bg-white/[0.05] px-1.5 py-0.5 rounded">
                      {item.browser}
                    </span>
                    <span className="text-[11px] font-mono text-amber-400">
                      {item.flakeRate}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <AnimatedSparkline
                      points={item.sparkline}
                      color={item.status === 'quarantined' ? '#f43f5e' : '#FBBF24'}
                      width={60}
                      height={20}
                    />
                    <button
                      onClick={() => toggleFlakyQuarantine(item.id)}
                      className="rounded border border-white/[0.08] px-2 py-0.5 text-[10px] font-mono text-neutral-300 hover:text-white hover:bg-white/[0.05] transition-colors cursor-pointer"
                    >
                      {item.status === 'quarantined' ? 'Unquarantine' : 'Quarantine'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </RoleSurfaceCard>

        {/* Release Regression Checklist */}
        <RoleSurfaceCard className="lg:col-span-4 space-y-4">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
            <div>
              <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
                <CheckSquare className="h-4 w-4 text-amber-400" />
                <span>Regression Verification</span>
              </h3>
              <p className="text-[11px] text-neutral-400">
                Pre-release smoke tests ({completedChecks}/{totalChecks})
              </p>
            </div>
            <span
              className={`rounded px-2 py-0.5 text-[10px] font-mono font-bold ${
                allChecksPassed
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
              }`}
            >
              {allChecksPassed ? 'READY' : 'IN PROGRESS'}
            </span>
          </div>

          {/* Progress bar */}
          <div className="h-1.5 w-full rounded-full bg-white/[0.06] overflow-hidden">
            <div
              className="h-full bg-amber-400 transition-all duration-300 rounded-full"
              style={{
                width: `${totalChecks > 0 ? (completedChecks / totalChecks) * 100 : 0}%`,
              }}
            />
          </div>

          <div className="space-y-2">
            {regressionList.map((check) => (
              <label
                key={check.id}
                onClick={() => toggleRegressionCheck(check.id)}
                className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-white/[0.03] transition-colors cursor-pointer select-none"
              >
                <button
                  type="button"
                  className="mt-0.5 text-amber-400 flex-shrink-0 cursor-pointer"
                >
                  {check.checked ? (
                    <CheckSquare className="h-4 w-4 text-amber-400" />
                  ) : (
                    <Square className="h-4 w-4 text-neutral-500" />
                  )}
                </button>
                <div className="min-w-0 flex-1">
                  <div
                    className={`text-xs ${
                      check.checked
                        ? 'line-through text-neutral-500'
                        : 'text-neutral-200'
                    }`}
                  >
                    {check.label}
                  </div>
                  <span className="font-mono text-[10px] text-amber-400/70">
                    {check.targetIssue}
                  </span>
                </div>
              </label>
            ))}
          </div>

          <div className="pt-2 border-t border-white/[0.06]">
            <button
              disabled={!allChecksPassed}
              onClick={() => showToast('Release Gate successfully signed off for production!')}
              className={`w-full rounded-xl py-2 text-xs font-semibold transition-all ${
                allChecksPassed
                  ? 'bg-amber-400 text-slate-950 hover:bg-amber-300 shadow-md shadow-amber-400/20 cursor-pointer'
                  : 'bg-white/[0.04] text-neutral-500 cursor-not-allowed'
              }`}
            >
              {allChecksPassed ? 'Sign off release for deploy' : 'Complete all checks to sign off'}
            </button>
          </div>
        </RoleSurfaceCard>
      </StaggerItem>

      {/* Reject Reason Modal */}
      <AnimatePresence>
        {rejectModalCard && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setRejectModalCard(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-lg rounded-2xl border border-rose-500/40 bg-[#0d1017] p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                <div className="flex items-center gap-2 text-rose-400 font-mono text-sm font-bold">
                  <XCircle className="h-5 w-5" />
                  <span>Reject Issue: {rejectModalCard.code}</span>
                </div>
                <button
                  onClick={() => setRejectModalCard(null)}
                  className="text-neutral-400 hover:text-white cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleConfirmReject} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    Issue Title
                  </label>
                  <p className="text-xs text-neutral-400 bg-white/[0.03] p-2.5 rounded-lg border border-white/[0.05]">
                    {rejectModalCard.title}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-1">
                      Defect Category
                    </label>
                    <select
                      value={rejectCategory}
                      onChange={(e) =>
                        setRejectCategory(
                          e.target.value as 'functional' | 'regression' | 'performance' | 'flaky'
                        )
                      }
                      className="w-full rounded-lg border border-white/[0.08] bg-[#141824] px-3 py-2 text-xs text-white focus:border-rose-500 focus:outline-none"
                    >
                      <option value="functional">Functional Defect</option>
                      <option value="regression">Regression Failure</option>
                      <option value="performance">Performance / Latency</option>
                      <option value="flaky">Flaky / Edge Case</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-1">
                      Severity
                    </label>
                    <select
                      value={rejectSeverity}
                      onChange={(e) =>
                        setRejectSeverity(
                          e.target.value as 'blocker' | 'critical' | 'major' | 'minor'
                        )
                      }
                      className="w-full rounded-lg border border-white/[0.08] bg-[#141824] px-3 py-2 text-xs text-white focus:border-rose-500 focus:outline-none"
                    >
                      <option value="blocker">Blocker (S0)</option>
                      <option value="critical">Critical (S1)</option>
                      <option value="major">Major (S2)</option>
                      <option value="minor">Minor (S3)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    Steps to Reproduce & Defect Details
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Enter reproduction steps, expected vs actual behavior, or log traces..."
                    className="w-full rounded-lg border border-white/[0.08] bg-[#141824] p-3 text-xs text-white placeholder-neutral-500 focus:border-rose-500 focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/[0.08]">
                  <button
                    type="button"
                    onClick={() => setRejectModalCard(null)}
                    className="rounded-lg px-3.5 py-1.5 text-xs text-neutral-400 hover:text-white cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-lg bg-rose-500 px-4 py-1.5 text-xs font-semibold text-white hover:bg-rose-400 transition-colors shadow-lg shadow-rose-500/20 cursor-pointer"
                  >
                    Reject Issue & Return to Owner
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </StaggerContainer>
  );
};

export default QADashboard;
