import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useProjects } from '../context/ProjectContext';
import { useAuth } from '../context/AuthContext';
import { getRoleTheme, useSyncRoleCssVariables } from '../theme/roleTheme';
import { FlowButton } from '../components/ui/FlowButton';
import {
  Sparkles,
  BrainCircuit,
  Cpu,
  Layers,
  AlertCircle,
  CheckCircle2,
  Play,
  ArrowRight,
  ShieldCheck,
  Zap,
  Terminal,
  BookOpen,
  Plus,
  Clock,
  Tag,
  Flame,
  Check,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import api from '../services/api';

const AI_STORAGE_KEY = 'pulsedev_ai_assistant_state';

interface StoredAiState {
  epicTitle: string;
  epicDesc: string;
  generatedTasks: any[];
  auditTopic: string;
  auditPrompt: string;
  auditResult: any | null;
  interviewCat: string;
  qaResult: string | null;
}

function loadPersistedAiState(): StoredAiState {
  try {
    const raw = localStorage.getItem(AI_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        epicTitle: parsed.epicTitle || '',
        epicDesc: parsed.epicDesc || '',
        generatedTasks: Array.isArray(parsed.generatedTasks) ? parsed.generatedTasks : [],
        auditTopic: parsed.auditTopic || 'JWT_SECURITY',
        auditPrompt: parsed.auditPrompt || '',
        auditResult: parsed.auditResult || null,
        interviewCat: parsed.interviewCat || 'mongodb',
        qaResult: parsed.qaResult || null,
      };
    }
  } catch {
    // ignore
  }
  return {
    epicTitle: '',
    epicDesc: '',
    generatedTasks: [],
    auditTopic: 'JWT_SECURITY',
    auditPrompt: '',
    auditResult: null,
    interviewCat: 'mongodb',
    qaResult: null,
  };
}

export const AiAssistant: React.FC = () => {
  const { activeProject, createTask } = useProjects();
  const { user } = useAuth();
  const roleTheme = useSyncRoleCssVariables(user?.role);

  const [activeTab, setActiveTab] = useState<'sprint' | 'audit' | 'interview'>('sprint');

  const persisted = loadPersistedAiState();

  // Clean form state without prefilled dummy text
  const [epicTitle, setEpicTitle] = useState(persisted.epicTitle);
  const [epicDesc, setEpicDesc] = useState(persisted.epicDesc);
  const [isGeneratingSprint, setIsGeneratingSprint] = useState(false);
  const [sprintError, setSprintError] = useState<string | null>(null);
  const [generatedTasks, setGeneratedTasks] = useState<any[]>(persisted.generatedTasks);
  const [addedTaskIndices, setAddedTaskIndices] = useState<Set<number>>(new Set());

  // Audit state
  const [auditTopic, setAuditTopic] = useState(persisted.auditTopic);
  const [auditPrompt, setAuditPrompt] = useState(persisted.auditPrompt);
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditResult, setAuditResult] = useState<any | null>(persisted.auditResult);

  // Knowledge Base state
  const [interviewCat, setInterviewCat] = useState(persisted.interviewCat);
  const [isGeneratingQA, setIsGeneratingQA] = useState(false);
  const [qaResult, setQaResult] = useState<string | null>(persisted.qaResult);

  // Save changes so refreshing the page preserves all results and user inputs
  useEffect(() => {
    try {
      const stateToSave: StoredAiState = {
        epicTitle,
        epicDesc,
        generatedTasks,
        auditTopic,
        auditPrompt,
        auditResult,
        interviewCat,
        qaResult,
      };
      localStorage.setItem(AI_STORAGE_KEY, JSON.stringify(stateToSave));
    } catch {
      // ignore
    }
  }, [
    epicTitle,
    epicDesc,
    generatedTasks,
    auditTopic,
    auditPrompt,
    auditResult,
    interviewCat,
    qaResult,
  ]);

  const handleClearForm = () => {
    setEpicTitle('');
    setEpicDesc('');
    setGeneratedTasks([]);
    setAddedTaskIndices(new Set());
    setSprintError(null);
  };

  const handleClearAudit = () => {
    setAuditPrompt('');
    setAuditResult(null);
  };

  const handleClearGuide = () => {
    setQaResult(null);
  };

  const handleGenerateSprint = async () => {
    if (!epicTitle.trim()) {
      setSprintError('Please enter an Epic or Feature title before generating.');
      return;
    }
    setIsGeneratingSprint(true);
    setSprintError(null);
    setGeneratedTasks([]);
    setAddedTaskIndices(new Set());
    try {
      const res = await api.ai.generateSprint(epicTitle, epicDesc);
      if (res.success && res.tasks) {
        setGeneratedTasks(res.tasks);
      }
    } catch (e: any) {
      setSprintError('AI Generation error: ' + (e.message || 'Unable to generate sprint stories.'));
    } finally {
      setIsGeneratingSprint(false);
    }
  };

  const handleAddToBacklog = async (task: any, index: number) => {
    await createTask({
      title: task.title,
      description: task.description,
      column: task.column || 'backlog',
      priority: task.priority || 'high',
      estimateHours: task.estimateHours || 6,
      tags: task.tags || ['AI', 'Generated'],
    });
    setAddedTaskIndices((prev) => new Set(prev).add(index));
  };

  const handleRunAudit = async () => {
    setIsAuditing(true);
    setAuditResult(null);
    try {
      const res = await api.ai.deepAudit(auditTopic, auditPrompt || undefined);
      if (res.success) {
        setAuditResult(res);
      }
    } catch (e: any) {
      setAuditResult({ error: e.message });
    } finally {
      setIsAuditing(false);
    }
  };

  const handleRunInterviewQA = async () => {
    setIsGeneratingQA(true);
    setQaResult(null);
    try {
      const res = await api.ai.interviewQA(interviewCat);
      if (res.success) {
        setQaResult(res.content);
      }
    } catch (e: any) {
      setQaResult('Error: ' + e.message);
    } finally {
      setIsGeneratingQA(false);
    }
  };

  const AUDIT_TOPICS = [
    {
      id: 'JWT_SECURITY',
      title: 'Zero-Trust JWT & Cryptographic Salts',
      badge: 'SEC-01',
      desc: 'Constant-time verification, HMAC SHA256 timing attack protection, stateless revocations.',
      metrics: '256-bit entropy · < 2ms verify',
    },
    {
      id: 'MONGO_INDEX',
      title: 'MongoDB Compound ESR & Buffers',
      badge: 'DB-04',
      desc: 'Eliminates in-memory COLLSCAN, sets Equality-Sort-Range compound keys, keeps index in wiredTiger cache.',
      metrics: 'Index hit ratio 99.4% · Zero COLLSCAN',
    },
    {
      id: 'EVENT_LOOP',
      title: 'Event Loop Non-Blocking Pipeline',
      badge: 'PERF-08',
      desc: 'Prevents thread-pool starvation (UV_THREADPOOL_SIZE), enforces backpressure on streaming webhooks.',
      metrics: '< 1.4ms p99 lag · Zero blocking syncs',
    },
  ];

  const KNOWLEDGE_CATEGORIES = [
    { id: 'mongodb', label: 'MongoDB & Mongoose ESR', icon: Zap },
    { id: 'node & express event loop', label: 'Node Event Loop & Concurrency', icon: Cpu },
    { id: 'jwt & system security', label: 'Zero-Trust JWT & Session Hardening', icon: ShieldCheck },
    { id: 'react 19 & state concurrency', label: 'React 19 & Concurrent State', icon: Terminal },
  ];

  return (
    <div
      className="flex-1 flex flex-col overflow-hidden bg-[#090b10] text-[#f3f5f8] relative selection:bg-emerald-500/30 selection:text-white"
      style={{
        backgroundImage: roleTheme.radialBackdropCss,
      }}
    >
      {/* Top Ambient Subtle Scanline Tint */}
      <div
        className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 h-72 w-3/4 rounded-full blur-3xl opacity-20"
        style={{ backgroundColor: roleTheme.accentHex }}
      />

      {/* Header with Linear-Style Precision & Role Identity */}
      <div className="relative z-10 border-b border-white/[0.08] bg-[#0c0f17]/85 backdrop-blur-xl px-6 py-4.5">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            {/* Pulsing Icon Shield */}
            <div
              className="relative flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl border shadow-xl overflow-hidden transition-all duration-300"
              style={{
                borderColor: `rgba(${roleTheme.accentRgb}, 0.35)`,
                background: `linear-gradient(135deg, rgba(${roleTheme.accentRgb}, 0.18) 0%, rgba(14, 17, 24, 0.95) 100%)`,
                boxShadow: `0 0 24px -4px rgba(${roleTheme.accentRgb}, 0.25)`,
              }}
            >
              <div
                className="absolute inset-0 opacity-40 blur-sm"
                style={{ backgroundImage: roleTheme.gradientCss }}
              />
              <BrainCircuit
                className="relative z-10 h-5.5 w-5.5 transition-transform duration-300 group-hover:scale-110"
                style={{ color: roleTheme.accentHex }}
              />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                  PulseDev AI Copilot
                </h1>
                <span
                  className="rounded-full border px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider"
                  style={{
                    borderColor: `rgba(${roleTheme.accentRgb}, 0.35)`,
                    backgroundColor: `rgba(${roleTheme.accentRgb}, 0.1)`,
                    color: roleTheme.accentHex,
                  }}
                >
                  Gemini 2.5 Pro · Role Aware
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-mono text-neutral-400">
                  <span
                    className="inline-block h-1.5 w-1.5 rounded-full animate-pulse"
                    style={{ backgroundColor: roleTheme.accentHex }}
                  />
                  Cockpit: {roleTheme.cockpitTitle}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-neutral-400 line-clamp-1">
                Autonomous sprint backlog synthesis, zero-trust architectural audits, and real-time technical runbooks.
              </p>
            </div>
          </div>

          {/* Role Status Tag */}
          <div className="hidden lg:flex items-center gap-2 self-start sm:self-center">
            <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-right">
              <div className="text-[10px] font-mono uppercase tracking-wider text-neutral-400">
                Active Initiative
              </div>
              <div className="text-xs font-semibold text-white">
                {activeProject?.key || 'PAY'} · {activeProject?.title?.slice(0, 24) || 'PulseDev Core'}
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation Pill Bar */}
        <div className="max-w-6xl mx-auto mt-4 pt-3 border-t border-white/[0.06] flex items-center gap-2 overflow-x-auto no-scrollbar">
          {[
            { id: 'sprint' as const, label: 'Story Planner', icon: Layers, count: generatedTasks.length },
            { id: 'audit' as const, label: 'Architecture Review', icon: Cpu, badge: 'Live' },
            { id: 'interview' as const, label: 'Knowledge Base', icon: BookOpen, badge: 'Runbooks' },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`group relative flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'text-white shadow-lg'
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-white/[0.03]'
                }`}
                style={
                  isActive
                    ? {
                        backgroundColor: `rgba(${roleTheme.accentRgb}, 0.14)`,
                        borderColor: `rgba(${roleTheme.accentRgb}, 0.35)`,
                        borderWidth: '1px',
                        borderStyle: 'solid',
                        boxShadow: `0 0 16px -4px rgba(${roleTheme.accentRgb}, 0.28)`,
                      }
                    : {
                        border: '1px solid transparent',
                      }
                }
              >
                <Icon
                  className="h-3.5 w-3.5 transition-colors"
                  style={{
                    color: isActive ? roleTheme.accentHex : undefined,
                  }}
                />
                <span>{tab.label}</span>
                {tab.count !== undefined && tab.count > 0 && (
                  <span
                    className="ml-1 rounded-full px-1.5 py-0.2 font-mono text-[10px] font-bold"
                    style={{
                      backgroundColor: roleTheme.accentHex,
                      color: '#090b10',
                    }}
                  >
                    {tab.count}
                  </span>
                )}
                {tab.badge && !isActive && (
                  <span className="rounded bg-white/[0.06] px-1.5 py-0.2 font-mono text-[9px] text-neutral-400">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto px-6 py-6 scroll-smooth">
        <div className="max-w-6xl mx-auto space-y-6">

          {/* TAB 1: SPRINT PLANNER */}
          {activeTab === 'sprint' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="space-y-6"
            >
              {/* Generator Hero Card with Rotating Border & Accent Top */}
              <div
                className="relative rounded-2xl border border-white/[0.08] bg-[#0c1017]/95 p-6 shadow-2xl backdrop-blur-xl overflow-hidden"
                style={{
                  boxShadow: `0 20px 48px -12px rgba(0,0,0,0.7), 0 0 32px -10px rgba(${roleTheme.accentRgb}, 0.12)`,
                }}
              >
                {/* Top glow border */}
                <div
                  className="absolute top-0 left-0 right-0 h-[2px]"
                  style={{ backgroundImage: roleTheme.gradientCss }}
                />

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-white/[0.07] gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-flex h-2 w-2 rounded-full"
                        style={{ backgroundColor: roleTheme.accentHex }}
                      />
                      <h3 className="text-sm font-bold text-white tracking-tight">
                        Generate Technical Sprint Backlog
                      </h3>
                    </div>
                    <p className="mt-0.5 text-xs text-neutral-400">
                      Enter your feature or user story below to automatically synthesize concrete sprint tasks with estimates.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {(epicTitle || epicDesc || generatedTasks.length > 0) && (
                      <button
                        type="button"
                        onClick={handleClearForm}
                        className="flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.02] px-2.5 py-1 text-[11px] font-mono text-neutral-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
                        title="Clear all fields and generated tasks"
                      >
                        <Trash2 className="h-3 w-3" />
                        <span>Clear</span>
                      </button>
                    )}
                    <div className="flex items-center gap-2 text-[11px] font-mono text-neutral-400 bg-white/[0.03] px-3 py-1 rounded-lg border border-white/[0.06] self-start sm:self-auto">
                      <span>Engine:</span>
                      <span className="font-semibold text-white">Gemini Structured Spec</span>
                    </div>
                  </div>
                </div>

                {sprintError && (
                  <div className="mt-4 flex items-center gap-2.5 rounded-xl border border-rose-500/40 bg-rose-500/10 p-3.5 text-xs text-rose-300">
                    <AlertCircle className="h-4 w-4 text-rose-400 flex-shrink-0" />
                    <span>{sprintError}</span>
                  </div>
                )}

                <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-1.5 flex items-center justify-between">
                      <span>Epic / Feature Title</span>
                      <span className="text-[10px] font-mono text-neutral-500">Required</span>
                    </label>
                    <input
                      type="text"
                      value={epicTitle}
                      onChange={(e) => setEpicTitle(e.target.value)}
                      placeholder="e.g. 3DS Biometric Frictionless Checkout v2"
                      className="w-full rounded-xl border border-white/[0.1] bg-[#080b11] px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none transition-all"
                      style={{
                        boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.5)',
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = roleTheme.accentHex;
                        e.currentTarget.style.boxShadow = `0 0 12px -2px rgba(${roleTheme.accentRgb}, 0.25)`;
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                        e.currentTarget.style.boxShadow = 'inset 0 1px 2px rgba(0,0,0,0.5)';
                      }}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-1.5 flex items-center justify-between">
                      <span>Technical Scope & Constraints</span>
                      <span className="text-[10px] font-mono text-neutral-500">Optional</span>
                    </label>
                    <textarea
                      rows={2}
                      value={epicDesc}
                      onChange={(e) => setEpicDesc(e.target.value)}
                      placeholder="e.g. Integrate Visa/Mastercard 3DS SDK, add fallback webhook retry loop, zero downtime..."
                      className="w-full rounded-xl border border-white/[0.1] bg-[#080b11] px-3.5 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none transition-all resize-none"
                      style={{
                        boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.5)',
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = roleTheme.accentHex;
                        e.currentTarget.style.boxShadow = `0 0 12px -2px rgba(${roleTheme.accentRgb}, 0.25)`;
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                        e.currentTarget.style.boxShadow = 'inset 0 1px 2px rgba(0,0,0,0.5)';
                      }}
                    />
                  </div>
                </div>

                {/* Flow Button Call to Action */}
                <div className="mt-5 flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-white/[0.07]">
                  <div className="flex items-center gap-2 text-xs text-neutral-400">
                    <Sparkles className="h-3.5 w-3.5" style={{ color: roleTheme.accentHex }} />
                    <span>Automatically maps to Active Sprint columns and assigns realistic story points</span>
                  </div>

                  <FlowButton
                    text={isGeneratingSprint ? 'Gemini Generating Stories...' : 'Generate 3 Sprint Stories'}
                    variant="accent"
                    size="md"
                    accentColor={roleTheme.accentHex}
                    onClick={handleGenerateSprint}
                    disabled={isGeneratingSprint}
                    icon={Sparkles}
                  />
                </div>
              </div>

              {/* Generated Task Cards Grid */}
              {generatedTasks.length > 0 && (
                <div className="space-y-4 pt-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                        Generated Backlog Stories
                      </h4>
                      <span
                        className="rounded-full px-2 py-0.5 font-mono text-[11px] font-bold"
                        style={{
                          backgroundColor: `rgba(${roleTheme.accentRgb}, 0.15)`,
                          color: roleTheme.accentHex,
                        }}
                      >
                        {generatedTasks.length} Ready
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-neutral-500">
                      Click "+ Add to Backlog" to insert into Kanban
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {generatedTasks.map((t, idx) => {
                      const isAdded = addedTaskIndices.has(idx);
                      const priorityColor =
                        t.priority?.toLowerCase() === 'urgent'
                          ? 'text-rose-400 bg-rose-500/15 border-rose-500/30'
                          : t.priority?.toLowerCase() === 'high'
                          ? 'text-amber-400 bg-amber-500/15 border-amber-500/30'
                          : 'text-cyan-400 bg-cyan-500/15 border-cyan-500/30';

                      return (
                        <div
                          key={idx}
                          className="group relative rounded-2xl border border-white/[0.08] bg-[#0c1017]/90 p-4.5 flex flex-col justify-between space-y-4 transition-all duration-200 hover:-translate-y-1 hover:border-white/[0.18]"
                          style={{
                            boxShadow: '0 8px 24px -6px rgba(0,0,0,0.5)',
                          }}
                        >
                          <div>
                            <div className="flex items-center justify-between mb-2.5">
                              <span
                                className={`rounded-md border px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider ${priorityColor}`}
                              >
                                {t.priority || 'HIGH'}
                              </span>
                              <div className="flex items-center gap-1 font-mono text-xs text-neutral-400">
                                <Clock className="h-3 w-3 text-neutral-500" />
                                <span>{t.estimateHours || 6}h</span>
                              </div>
                            </div>

                            <h5 className="font-bold text-xs text-white leading-snug group-hover:text-emerald-300 transition-colors">
                              {t.title}
                            </h5>
                            <p className="text-[11px] text-neutral-400 mt-2 leading-relaxed line-clamp-3">
                              {t.description}
                            </p>

                            <div className="flex flex-wrap gap-1.5 mt-3">
                              {(t.tags || []).map((tag: string, i: number) => (
                                <span
                                  key={i}
                                  className="rounded-md border border-white/[0.06] bg-white/[0.03] px-2 py-0.5 text-[10px] font-mono text-neutral-400"
                                >
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          </div>

                          <div className="pt-2 border-t border-white/[0.06]">
                            <FlowButton
                              text={isAdded ? '✓ Added to Sprint Board' : '+ Add to Backlog'}
                              variant={isAdded ? 'secondary' : 'accent'}
                              size="sm"
                              accentColor={roleTheme.accentHex}
                              onClick={() => handleAddToBacklog(t, idx)}
                              disabled={isAdded}
                              className="w-full justify-center"
                              icon={isAdded ? Check : Plus}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* TAB 2: ARCHITECTURE AUDIT */}
          {activeTab === 'audit' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="space-y-6"
            >
              <div
                className="relative rounded-2xl border border-white/[0.08] bg-[#0c1017]/95 p-6 shadow-2xl backdrop-blur-xl overflow-hidden"
                style={{
                  boxShadow: `0 20px 48px -12px rgba(0,0,0,0.7), 0 0 32px -10px rgba(${roleTheme.accentRgb}, 0.12)`,
                }}
              >
                {/* Top glow border */}
                <div
                  className="absolute top-0 left-0 right-0 h-[2px]"
                  style={{ backgroundImage: roleTheme.gradientCss }}
                />

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-white/[0.07] gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-flex h-2 w-2 rounded-full"
                        style={{ backgroundColor: roleTheme.accentHex }}
                      />
                      <h3 className="text-sm font-bold text-white tracking-tight">
                        Architecture & Security Auditor
                      </h3>
                    </div>
                    <p className="mt-0.5 text-xs text-neutral-400">
                      Autonomous deep analysis of microservices, database schemas, cryptographic integrity, and async pipelines.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {(auditPrompt || auditResult) && (
                      <button
                        type="button"
                        onClick={handleClearAudit}
                        className="flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.02] px-2.5 py-1 text-[11px] font-mono text-neutral-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
                        title="Clear audit results"
                      >
                        <Trash2 className="h-3 w-3" />
                        <span>Clear</span>
                      </button>
                    )}
                    <div className="flex items-center gap-2 text-[11px] font-mono text-neutral-400 bg-white/[0.03] px-3 py-1 rounded-lg border border-white/[0.06] self-start sm:self-auto">
                      <ShieldCheck className="h-3.5 w-3.5" style={{ color: roleTheme.accentHex }} />
                      <span>Zero-Trust Protocol</span>
                    </div>
                  </div>
                </div>

                {/* Audit Topics Selection Cards */}
                <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  {AUDIT_TOPICS.map((t) => {
                    const isSelected = auditTopic === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setAuditTopic(t.id)}
                        className={`group relative rounded-xl border p-4 text-left transition-all duration-200 cursor-pointer overflow-hidden ${
                          isSelected
                            ? 'bg-white/[0.04] shadow-lg'
                            : 'border-white/[0.08] bg-[#090b10] hover:border-white/[0.16] hover:bg-white/[0.02]'
                        }`}
                        style={
                          isSelected
                            ? {
                                borderColor: roleTheme.accentHex,
                                boxShadow: `0 0 20px -4px rgba(${roleTheme.accentRgb}, 0.25)`,
                              }
                            : {}
                        }
                      >
                        {isSelected && (
                          <div
                            className="absolute top-0 left-0 right-0 h-[2px]"
                            style={{ backgroundColor: roleTheme.accentHex }}
                          />
                        )}
                        <div className="flex items-center justify-between mb-1.5">
                          <span
                            className="font-mono text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border"
                            style={
                              isSelected
                                ? {
                                    borderColor: `rgba(${roleTheme.accentRgb}, 0.4)`,
                                    backgroundColor: `rgba(${roleTheme.accentRgb}, 0.12)`,
                                    color: roleTheme.accentHex,
                                  }
                                : {
                                    borderColor: 'rgba(255,255,255,0.08)',
                                    color: '#9ba3b4',
                                  }
                            }
                          >
                            {t.badge}
                          </span>
                          {isSelected && (
                            <CheckCircle2
                              className="h-3.5 w-3.5"
                              style={{ color: roleTheme.accentHex }}
                            />
                          )}
                        </div>
                        <div className="font-semibold text-xs text-white group-hover:text-neutral-100">
                          {t.title}
                        </div>
                        <div className="text-[11px] text-neutral-400 mt-1 leading-relaxed">
                          {t.desc}
                        </div>
                        <div className="mt-3 pt-2 border-t border-white/[0.06] font-mono text-[9px] text-neutral-400">
                          {t.metrics}
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-5">
                  <label className="block text-xs font-semibold text-neutral-300 mb-1.5 flex items-center justify-between">
                    <span>Custom Inquiry, Snippet, or SLA Parameter (Optional)</span>
                    <span className="text-[10px] font-mono text-neutral-500">Freeform Prompt</span>
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Audit connection pool options for 10,000 RPS burst or review our token revocation blacklist logic..."
                    value={auditPrompt}
                    onChange={(e) => setAuditPrompt(e.target.value)}
                    className="w-full rounded-xl border border-white/[0.1] bg-[#080b11] px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none transition-all resize-none"
                    style={{
                      boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.5)',
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = roleTheme.accentHex;
                      e.currentTarget.style.boxShadow = `0 0 12px -2px rgba(${roleTheme.accentRgb}, 0.25)`;
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                      e.currentTarget.style.boxShadow = 'inset 0 1px 2px rgba(0,0,0,0.5)';
                    }}
                  />
                </div>

                {/* Audit Action with Flow Button */}
                <div className="mt-5 flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-white/[0.07]">
                  <div className="flex items-center gap-2 text-xs text-neutral-400">
                    <Cpu className="h-3.5 w-3.5" style={{ color: roleTheme.accentHex }} />
                    <span>Review code and architecture with Gemini.</span>
                  </div>

                  <FlowButton
                    text={isAuditing ? 'Reviewing...' : 'Run review'}
                    variant="accent"
                    size="md"
                    accentColor={roleTheme.accentHex}
                    onClick={handleRunAudit}
                    disabled={isAuditing}
                    icon={Cpu}
                  />
                </div>
              </div>

              {/* Audit Result Display */}
              {auditResult && (
                <div
                  className="rounded-2xl border border-white/[0.1] bg-[#0c1017]/95 p-6 shadow-2xl backdrop-blur-xl relative overflow-hidden"
                  style={{
                    boxShadow: `0 20px 48px -12px rgba(0,0,0,0.8), 0 0 24px -6px rgba(${roleTheme.accentRgb}, 0.2)`,
                  }}
                >
                  <div
                    className="absolute top-0 left-0 right-0 h-[2px]"
                    style={{ backgroundImage: roleTheme.gradientCss }}
                  />

                  <div className="flex items-center justify-between pb-3.5 border-b border-white/[0.07] mb-4">
                    <div className="flex items-center gap-2.5 font-bold text-xs text-white">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      <span>Gemini Technical Audit Verdict</span>
                    </div>
                    <span
                      className="rounded-md border px-2.5 py-0.5 font-mono text-[10px] font-semibold"
                      style={{
                        borderColor: `rgba(${roleTheme.accentRgb}, 0.4)`,
                        backgroundColor: `rgba(${roleTheme.accentRgb}, 0.1)`,
                        color: roleTheme.accentHex,
                      }}
                    >
                      Model: {auditResult.modelUsed || 'gemini-2.5-pro'}
                    </span>
                  </div>

                  {auditResult.error ? (
                    <div className="text-xs text-rose-400 bg-rose-500/10 p-4 rounded-xl border border-rose-500/30">
                      {auditResult.error}
                    </div>
                  ) : (
                    <div className="text-xs leading-relaxed text-neutral-200 whitespace-pre-wrap font-sans bg-[#080b11] p-4.5 rounded-xl border border-white/[0.06] font-mono selection:bg-emerald-500/40">
                      {auditResult.analysis}
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {/* TAB 3: KNOWLEDGE BASE */}
          {activeTab === 'interview' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="space-y-6"
            >
              <div
                className="relative rounded-2xl border border-white/[0.08] bg-[#0c1017]/95 p-6 shadow-2xl backdrop-blur-xl overflow-hidden"
                style={{
                  boxShadow: `0 20px 48px -12px rgba(0,0,0,0.7), 0 0 32px -10px rgba(${roleTheme.accentRgb}, 0.12)`,
                }}
              >
                {/* Top glow border */}
                <div
                  className="absolute top-0 left-0 right-0 h-[2px]"
                  style={{ backgroundImage: roleTheme.gradientCss }}
                />

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-white/[0.07] gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-flex h-2 w-2 rounded-full"
                        style={{ backgroundColor: roleTheme.accentHex }}
                      />
                      <h3 className="text-sm font-bold text-white tracking-tight">
                        Engineering Runbooks & Architecture Playbooks
                      </h3>
                    </div>
                    <p className="mt-0.5 text-xs text-neutral-400">
                      Generate live incident mitigation runbooks, failover playbooks, and architectural reference manuals.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {qaResult && (
                      <button
                        type="button"
                        onClick={handleClearGuide}
                        className="flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.02] px-2.5 py-1 text-[11px] font-mono text-neutral-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
                        title="Clear generated playbook"
                      >
                        <Trash2 className="h-3 w-3" />
                        <span>Clear</span>
                      </button>
                    )}
                    <div className="flex items-center gap-2 text-[11px] font-mono text-neutral-400 bg-white/[0.03] px-3 py-1 rounded-lg border border-white/[0.06] self-start sm:self-auto">
                      <BookOpen className="h-3.5 w-3.5" style={{ color: roleTheme.accentHex }} />
                      <span>Interactive Guides</span>
                    </div>
                  </div>
                </div>

                {/* Categories */}
                <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  {KNOWLEDGE_CATEGORIES.map((cat) => {
                    const isSelected = interviewCat.includes(cat.id.split(' ')[0]);
                    const Icon = cat.icon;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setInterviewCat(cat.id)}
                        className={`group flex items-center gap-2.5 rounded-xl border p-3 text-left transition-all duration-200 cursor-pointer ${
                          isSelected
                            ? 'bg-white/[0.04] shadow-md'
                            : 'border-white/[0.08] bg-[#090b10] hover:border-white/[0.16] hover:bg-white/[0.02]'
                        }`}
                        style={
                          isSelected
                            ? {
                                borderColor: roleTheme.accentHex,
                                color: '#ffffff',
                              }
                            : {
                                color: '#9ba3b4',
                              }
                        }
                      >
                        <Icon
                          className="h-4 w-4 flex-shrink-0 transition-colors"
                          style={{
                            color: isSelected ? roleTheme.accentHex : undefined,
                          }}
                        />
                        <span className="text-xs font-semibold">{cat.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Flow Button Call to Action */}
                <div className="mt-5 flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-white/[0.07]">
                  <div className="flex items-center gap-2 text-xs text-neutral-400">
                    <Play className="h-3 w-3 fill-current" style={{ color: roleTheme.accentHex }} />
                    <span>Synthesizes step-by-step production runbooks formatted in markdown</span>
                  </div>

                  <FlowButton
                    text={isGeneratingQA ? 'Generating Playbook...' : 'Generate Engineering Guide'}
                    variant="accent"
                    size="md"
                    accentColor={roleTheme.accentHex}
                    onClick={handleRunInterviewQA}
                    disabled={isGeneratingQA}
                    icon={Play}
                  />
                </div>
              </div>

              {/* QA Result Display */}
              {qaResult && (
                <div
                  className="rounded-2xl border border-white/[0.1] bg-[#0c1017]/95 p-6 shadow-2xl backdrop-blur-xl relative overflow-hidden"
                  style={{
                    boxShadow: `0 20px 48px -12px rgba(0,0,0,0.8), 0 0 24px -6px rgba(${roleTheme.accentRgb}, 0.2)`,
                  }}
                >
                  <div
                    className="absolute top-0 left-0 right-0 h-[2px]"
                    style={{ backgroundImage: roleTheme.gradientCss }}
                  />

                  <div className="flex items-center justify-between pb-3.5 border-b border-white/[0.07] mb-4">
                    <div className="flex items-center gap-2.5 font-bold text-xs text-white">
                      <Terminal className="h-4 w-4" style={{ color: roleTheme.accentHex }} />
                      <span>Production Engineering Playbook & Incident Guide</span>
                    </div>
                    <span
                      className="rounded-md border px-2.5 py-0.5 font-mono text-[10px] font-semibold"
                      style={{
                        borderColor: `rgba(${roleTheme.accentRgb}, 0.4)`,
                        backgroundColor: `rgba(${roleTheme.accentRgb}, 0.1)`,
                        color: roleTheme.accentHex,
                      }}
                    >
                      Topic: {interviewCat.toUpperCase()}
                    </span>
                  </div>

                  <div className="text-xs leading-relaxed text-neutral-200 whitespace-pre-wrap font-sans bg-[#080b11] p-5 rounded-xl border border-white/[0.06] font-mono selection:bg-emerald-500/40">
                    {qaResult}
                  </div>
                </div>
              )}
            </motion.div>
          )}

        </div>
      </div>
    </div>
  );
};

export default AiAssistant;
