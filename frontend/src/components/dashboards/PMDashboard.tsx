import React, { useState } from 'react';
import { motion } from 'motion/react';
import { RoleCockpitProps } from './AdminDashboard';
import {
  AnimatedRadialGauge,
  HeroConicFrame,
  RoleSurfaceCard,
  StaggerContainer,
  StaggerItem,
  useCountUp,
  FlowButton,
} from '../ui/RoleSharedUI';
import {
  Calendar,
  Sparkles,
  Plus,
  TrendingUp,
  Target,
  Users,
  CheckCircle2,
  Clock,
  Sliders,
} from 'lucide-react';

const FUNNEL_STAGES = [
  { stage: '1. Checkout Session Initiated', pct: 100, count: '142,800 merchants' },
  { stage: '2. One-Click Wallet Selected', pct: 84, count: '119,952 sessions' },
  { stage: '3. 3DS 2.0 Biometric Verified', pct: 76, count: '108,528 verified' },
  { stage: '4. Payment Settled (<50ms)', pct: 72, count: '102,816 completed (+14.2%)' },
];

const INITIAL_STAKEHOLDERS = [
  {
    id: 'sh-1',
    team: 'PCI-DSS & European Legal Compliance',
    owner: 'Elena Rostova · VP Legal',
    signed: true,
  },
  {
    id: 'sh-2',
    team: 'Enterprise Merchant Success',
    owner: 'Jordan Blake · Product Lead',
    signed: true,
  },
  {
    id: 'sh-3',
    team: 'Checkout UX & Accessibility Guild',
    owner: 'Maya Lin · Staff Designer',
    signed: true,
  },
  {
    id: 'sh-4',
    team: 'Executive Release Go / No-Go',
    owner: 'Alex Chen · Principal Architect',
    signed: false,
  },
];

export const PMDashboard: React.FC<RoleCockpitProps> = ({
  theme,
  projects,
  activeProject,
  tasks,
  onNavigate,
  onOpenNewProject,
  onOpenNewTask,
}) => {
  const [stakeholders, setStakeholders] = useState(() => {
    try {
      const saved = localStorage.getItem('pulsedev_pm_stakeholders');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return INITIAL_STAKEHOLDERS;
  });
  const [capacityPoints, setCapacityPoints] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('pulsedev_pm_capacity_points');
      if (saved) return Number(saved);
    } catch {}
    return 42;
  });
  const maxCapacity = 48;

  const totalHours = tasks.reduce((acc, t) => acc + (Number(t.estimateHours) || 6), 0);
  const completedCount = tasks.filter((t) => t.column === 'completed').length;
  const conversionLift = useCountUp(18);
  const npsScore = useCountUp(74);

  const toggleStakeholder = (id: string) => {
    setStakeholders((prev) => {
      const updated = prev.map((s) => (s.id === id ? { ...s, signed: !s.signed } : s));
      try {
        localStorage.setItem('pulsedev_pm_stakeholders', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  // Build Gantt bars from live projects list so newly created initiatives appear immediately
  const ganttRows = projects.map((proj, idx) => {
    const startOffset = idx === 0 ? 4 : idx === 1 ? 18 : idx === 2 ? 30 : 12;
    const widthPct = Math.max(38, Math.min(82, proj.progress || 65));
    const quarterWindow =
      idx === 0
        ? 'Oct 1 – Nov 18 · On Track'
        : idx === 1
        ? 'Oct 14 – Dec 05 · Beta'
        : idx === 2
        ? 'Nov 01 – Dec 20 · Scaling'
        : 'Q4 Active Roadmap';
    return {
      ...proj,
      startOffset,
      widthPct,
      quarterWindow,
    };
  });

  return (
    <StaggerContainer className="space-y-6">
      {/* HERO: Animated Quarterly Roadmap (Gantt-Style Bars per Initiative) */}
      <StaggerItem>
        <HeroConicFrame theme={theme}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-white/[0.07] pb-4 mb-5">
            <div>
              <div className="flex items-center gap-2 font-mono text-xs text-rose-300">
                <Calendar className="h-4 w-4 text-rose-400" />
                <span>PRODUCT DELIVERY STUDIO · QUARTERLY ROADMAP & OKRs</span>
              </div>
              <h2 className="mt-1 text-lg sm:text-xl font-bold text-white tracking-tight">
                Q4 Product Roadmap & Initiative Delivery Timeline
              </h2>
            </div>

            {/* Product Manager Shortcuts: New Initiative, New Issue & Generate Stories with AI */}
            <div className="flex flex-wrap items-center gap-2">
              <FlowButton
                text="Generate Stories with AI"
                size="sm"
                variant="accent"
                accentColor="#FB7185"
                onClick={() => onNavigate('ai')}
              />
              <FlowButton
                text="New Issue"
                size="sm"
                variant="secondary"
                onClick={onOpenNewTask}
              />
              <FlowButton
                text="New Initiative"
                size="sm"
                variant="primary"
                onClick={onOpenNewProject}
              />
            </div>
          </div>

          {/* Gantt Timeline Header Months */}
          <div className="space-y-3">
            <div className="grid grid-cols-12 text-[11px] font-mono text-neutral-400 border-b border-white/[0.06] pb-2 px-2">
              <div className="col-span-4">Initiative & Product Scope</div>
              <div className="col-span-2 text-center">OCT</div>
              <div className="col-span-3 text-center">NOV (SPRINT 44)</div>
              <div className="col-span-3 text-center">DEC GA RELEASE</div>
            </div>

            <div className="space-y-2.5">
              {ganttRows.map((row) => {
                const isCurrent = activeProject?._id === row._id;
                return (
                  <div
                    key={row._id}
                    onClick={() => onNavigate('projects')}
                    className={`grid grid-cols-1 lg:grid-cols-12 items-center gap-3 rounded-xl border p-3 transition-all cursor-pointer ${
                      isCurrent
                        ? 'border-rose-400/40 bg-rose-500/10'
                        : 'border-white/[0.06] bg-[#090c12] hover:border-white/[0.14]'
                    }`}
                  >
                    <div className="lg:col-span-4 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-rose-300">
                          {row.key}
                        </span>
                        <span className="text-xs font-semibold text-white truncate">
                          {row.title}
                        </span>
                      </div>
                      <div className="text-[11px] text-neutral-400 mt-0.5">
                        {row.quarterWindow} · {row.progress}% complete
                      </div>
                    </div>

                    {/* Animated Gantt Bar Track */}
                    <div className="lg:col-span-8 relative h-7 rounded-lg bg-[#0d111a] border border-white/[0.05] overflow-hidden flex items-center px-2">
                      <motion.div
                        initial={{ width: 0, opacity: 0.4 }}
                        animate={{ width: `${row.widthPct}%`, opacity: 1 }}
                        transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
                        style={{ marginLeft: `${row.startOffset}%` }}
                        className="h-4 rounded-md bg-gradient-to-r from-rose-400 via-pink-400 to-amber-300 flex items-center justify-between px-2.5 text-[10px] font-mono font-bold text-[#090b10] shadow-[0_0_16px_rgba(251,113,133,0.35)]"
                      >
                        <span className="truncate">{row.key}</span>
                        <span>{row.progress}%</span>
                      </motion.div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </HeroConicFrame>
      </StaggerItem>

      {/* ROW 2: OKR Progress Cards + Animated Sprint Burndown Chart */}
      <StaggerItem className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* OKR Progress Cards (7 cols) */}
        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <RoleSurfaceCard className="flex items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-rose-300 font-medium">
                <Target className="h-3.5 w-3.5" />
                <span>OKR 1 · Checkout Lift</span>
              </div>
              <div className="font-mono text-2xl font-bold text-white tabular-nums">
                +{conversionLift}.4%
              </div>
              <p className="text-xs text-neutral-400">
                One-Click Wallet conversion vs Q3 baseline
              </p>
            </div>
            <AnimatedRadialGauge
              value={88}
              color="#FB7185"
              secondaryColor="#F43F5E"
              label="88%"
              sublabel="OKR 1"
            />
          </RoleSurfaceCard>

          <RoleSurfaceCard className="flex items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-rose-300 font-medium">
                <TrendingUp className="h-3.5 w-3.5" />
                <span>OKR 2 · Merchant NPS</span>
              </div>
              <div className="font-mono text-2xl font-bold text-white tabular-nums">
                +{npsScore}
              </div>
              <p className="text-xs text-neutral-400">
                Enterprise checkout reliability satisfaction
              </p>
            </div>
            <AnimatedRadialGauge
              value={92}
              color="#FB7185"
              secondaryColor="#FBBF24"
              label="92%"
              sublabel="OKR 2"
            />
          </RoleSurfaceCard>

          {/* Scope vs Capacity Meter Card spanning 2 cols */}
          <RoleSurfaceCard className="sm:col-span-2 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-white">
                <Sliders className="h-4 w-4 text-rose-400" />
                <span>
                  Sprint 44 Scope-vs-Capacity Meter ({capacityPoints} / {maxCapacity} Story
                  Points · {totalHours}h Est.)
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCapacityPoints((p) => Math.max(24, p - 3))}
                  className="rounded border border-white/[0.1] bg-white/[0.04] px-2 py-0.5 font-mono text-xs text-neutral-300 hover:text-white cursor-pointer"
                >
                  -3 pts
                </button>
                <button
                  onClick={() => setCapacityPoints((p) => Math.min(54, p + 3))}
                  className="rounded border border-white/[0.1] bg-white/[0.04] px-2 py-0.5 font-mono text-xs text-neutral-300 hover:text-white cursor-pointer"
                >
                  +3 pts
                </button>
              </div>
            </div>

            <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
              <motion.div
                initial={{ width: 0 }}
                animate={{
                  width: `${Math.min(100, Math.round((capacityPoints / maxCapacity) * 100))}%`,
                }}
                transition={{ duration: 0.6 }}
                className={`h-full rounded-full ${
                  capacityPoints > maxCapacity
                    ? 'bg-amber-400'
                    : 'bg-gradient-to-r from-rose-400 via-pink-400 to-emerald-400'
                }`}
              />
            </div>

            <div className="flex items-center justify-between text-xs text-neutral-400 font-mono">
              <span>
                {capacityPoints > maxCapacity
                  ? 'Warning: Scope exceeds engineering sprint capacity by ' +
                    (capacityPoints - maxCapacity) +
                    ' pts'
                  : 'Optimal velocity zone · 5 days remaining in Cycle 44'}
              </span>
              <span className="text-rose-300">
                {completedCount}/{tasks.length} issues shipped
              </span>
            </div>
          </RoleSurfaceCard>
        </div>

        {/* Animated Sprint Burndown Chart (5 cols) */}
        <RoleSurfaceCard className="lg:col-span-5 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
            <div>
              <h3 className="text-sm font-semibold text-white">
                Sprint 44 Delivery Burndown
              </h3>
              <p className="text-xs text-neutral-400">
                Ideal guideline vs actual story point burn
              </p>
            </div>
            <span className="font-mono text-xs text-rose-300">-24% · Ahead of plan</span>
          </div>

          <div className="relative h-40 w-full rounded-xl border border-white/[0.05] bg-[#090c12] p-3">
            <svg viewBox="0 0 300 110" className="h-full w-full overflow-visible">
              <defs>
                <linearGradient id="pmBurnGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#FB7185" stopOpacity="0.32" />
                  <stop offset="100%" stopColor="#FB7185" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              {/* Ideal guideline */}
              <line
                x1="10"
                y1="14"
                x2="290"
                y2="98"
                stroke="rgba(255,255,255,0.2)"
                strokeWidth="1.5"
                strokeDasharray="4 4"
              />
              {/* Actual burndown fill + path */}
              <path
                d="M10,14 L65,26 L120,38 L175,34 L230,68 L290,88 L290,105 L10,105 Z"
                fill="url(#pmBurnGrad)"
              />
              <motion.path
                d="M10,14 L65,26 L120,38 L175,34 L230,68 L290,88"
                fill="none"
                stroke="#FB7185"
                strokeWidth="2.5"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.95, ease: 'easeOut' }}
              />
              <circle cx="290" cy="88" r="4" fill="#FB7185" />
            </svg>
          </div>

          <div className="flex items-center justify-between text-xs text-neutral-400 font-mono">
            <span>Day 1 (48 pts)</span>
            <span>Day 7</span>
            <span className="text-white">Today (11 pts left)</span>
          </div>
        </RoleSurfaceCard>
      </StaggerItem>

      {/* ROW 3: Merchant Conversion Funnel + Stakeholder Sign-Off Tracker */}
      <StaggerItem className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Merchant Conversion Funnel (7 cols) */}
        <RoleSurfaceCard className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
            <div>
              <h3 className="text-sm font-semibold text-white">
                Merchant Checkout Conversion Funnel
              </h3>
              <p className="text-xs text-neutral-400">
                 End-to-end payment completion telemetry across 142k sessions
              </p>
            </div>
            <span className="font-mono text-xs text-emerald-400">+14.2% net lift</span>
          </div>

          <div className="space-y-3">
            {FUNNEL_STAGES.map((f) => (
              <div key={f.stage} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-neutral-200">{f.stage}</span>
                  <span className="font-mono text-neutral-400">
                    {f.count} · <strong className="text-rose-300">{f.pct}%</strong>
                  </span>
                </div>
                <div className="h-3 w-full overflow-hidden rounded-lg bg-[#090c12] border border-white/[0.05]">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${f.pct}%` }}
                    transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
                    className="h-full rounded-md bg-gradient-to-r from-rose-400 via-pink-400 to-orange-300"
                  />
                </div>
              </div>
            ))}
          </div>
        </RoleSurfaceCard>

        {/* Stakeholder Sign-Off Tracker (5 cols) */}
        <RoleSurfaceCard className="lg:col-span-5 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
            <div>
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Users className="h-4 w-4 text-rose-400" />
                <span>Stakeholder Launch Sign-Off</span>
              </h3>
              <p className="text-xs text-neutral-400">
                Cross-functional release readiness approvals
              </p>
            </div>
            <span className="font-mono text-xs text-rose-300">
              {stakeholders.filter((s) => s.signed).length}/{stakeholders.length} signed
            </span>
          </div>

          <div className="space-y-2.5">
            {stakeholders.map((sh) => (
              <button
                key={sh.id}
                type="button"
                onClick={() => toggleStakeholder(sh.id)}
                className="flex w-full items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-[#090c12] p-3 text-left text-xs hover:border-rose-400/35 transition-colors cursor-pointer"
              >
                <div className="min-w-0">
                  <div className="font-semibold text-white truncate">{sh.team}</div>
                  <div className="text-[11px] text-neutral-400">{sh.owner}</div>
                </div>
                {sh.signed ? (
                  <span className="flex items-center gap-1 font-mono text-[11px] text-emerald-400 flex-shrink-0">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Signed</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-1 font-mono text-[11px] text-amber-400 flex-shrink-0">
                    <Clock className="h-3.5 w-3.5" />
                    <span>Pending</span>
                  </span>
                )}
              </button>
            ))}
          </div>
        </RoleSurfaceCard>
      </StaggerItem>
    </StaggerContainer>
  );
};

export default PMDashboard;
