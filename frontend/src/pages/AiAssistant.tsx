import React, { useState, useEffect } from 'react';
import { useProjects } from '../context/ProjectContext';
import { FlowButton } from '../components/ui/FlowButton';
import {
  ClipboardList,
  Code2,
  Layers,
  AlertCircle,
  CheckCircle2,
  Play,
  BookOpen,
  Plus,
  Clock,
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
  const accentColor = '#83a897';
  const roleTheme = {
    accentHex: accentColor,
    accentRgb: '131, 168, 151',
  };

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
  const [auditError, setAuditError] = useState<string | null>(null);

  // Knowledge Base state
  const [interviewCat, setInterviewCat] = useState(persisted.interviewCat);
  const [isGeneratingQA, setIsGeneratingQA] = useState(false);
  const [qaResult, setQaResult] = useState<string | null>(persisted.qaResult);
  const [qaError, setQaError] = useState<string | null>(null);

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
    setAuditError(null);
  };

  const handleClearGuide = () => {
    setQaResult(null);
    setQaError(null);
  };

  const handleGenerateSprint = async () => {
    if (!epicTitle.trim()) {
      setSprintError('Add a feature title first.');
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
      } else {
        setSprintError(res.message || 'Could not draft tasks. Try again.');
      }
    } catch (e: any) {
      setSprintError(e.message || 'Could not draft tasks. Try again.');
    } finally {
      setIsGeneratingSprint(false);
    }
  };

  const handleAddToBacklog = async (task: any, index: number) => {
    try {
      await createTask({
        title: task.title,
        description: task.description,
        column: task.column || 'backlog',
        priority: task.priority || 'high',
        estimateHours: task.estimateHours || 6,
        tags: task.tags || [],
      });
      setAddedTaskIndices((prev) => new Set(prev).add(index));
    } catch (error) {
      setSprintError(error instanceof Error ? error.message : 'Could not add this task.');
    }
  };

  const handleRunAudit = async () => {
    setIsAuditing(true);
    setAuditResult(null);
    setAuditError(null);
    try {
      const res = await api.ai.deepAudit(auditTopic, auditPrompt || undefined);
      if (res.success) {
        setAuditResult(res);
      } else {
        setAuditError('The review could not be completed. Please try again.');
      }
    } catch (e: any) {
      setAuditError(e.message || 'The review could not be completed. Please try again.');
    } finally {
      setIsAuditing(false);
    }
  };

  const handleRunInterviewQA = async () => {
    setIsGeneratingQA(true);
    setQaResult(null);
    setQaError(null);
    try {
      const res = await api.ai.interviewQA(interviewCat);
      if (res.success) {
        setQaResult(res.content);
      } else {
        setQaError('The guide could not be generated. Please try again.');
      }
    } catch (e: any) {
      setQaError(e.message || 'The guide could not be generated. Please try again.');
    } finally {
      setIsGeneratingQA(false);
    }
  };

  const AUDIT_TOPICS = [
    {
      id: 'JWT_SECURITY',
      title: 'Auth & JWT review',
      desc: 'Check how tokens and sessions are handled.',
    },
    {
      id: 'MONGO_INDEX',
      title: 'MongoDB query and index review',
      desc: 'Review queries and suggest useful indexes.',
    },
    {
      id: 'EVENT_LOOP',
      title: 'Async and performance review',
      desc: 'Look for blocking work in request handlers.',
    },
  ];

  const KNOWLEDGE_CATEGORIES = [
    { id: 'mongodb', label: 'MongoDB and Mongoose' },
    { id: 'node & express event loop', label: 'Node.js and Express' },
    { id: 'jwt & system security', label: 'Authentication and sessions' },
    { id: 'react 19 & state concurrency', label: 'React and state' },
  ];

  return (
    <div
      className="flex-1 flex flex-col overflow-hidden bg-[#090b10] text-[#f3f5f8] relative selection:bg-emerald-500/20 selection:text-white"
    >
      <div className="border-b border-white/[0.08] bg-[#0c0f17] px-6 py-4">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-lg font-semibold text-white">Planning Assistant</h1>
                {auditResult?.modelUsed && (
                  <span className="rounded-md border border-white/10 bg-white/[0.03] px-2 py-0.5 text-[11px] text-neutral-300">
                    {auditResult.modelUsed}
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-neutral-400">
                Plan work and check technical questions.
              </p>
            </div>
            {activeProject && (
              <div className="hidden rounded-md border border-white/[0.08] px-3 py-2 lg:block">
                <div className="text-[11px] text-neutral-400">Project</div>
                <div className="text-xs font-medium text-white">
                  {activeProject.key} · {activeProject.title}
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 flex items-center gap-2 overflow-x-auto border-t border-white/[0.06] pt-3 no-scrollbar">
            {[
              { id: 'sprint' as const, label: 'Story Planner', icon: Layers, count: generatedTasks.length },
              { id: 'audit' as const, label: 'Architecture Review', icon: Code2 },
              { id: 'interview' as const, label: 'Knowledge Base', icon: BookOpen },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'border-white/[0.16] bg-white/[0.06] text-white'
                      : 'border-transparent text-neutral-400 hover:bg-white/[0.03] hover:text-neutral-200'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{tab.label}</span>
                  {tab.count !== undefined && tab.count > 0 && (
                    <span className="text-xs text-neutral-400">{tab.count}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto px-6 py-6 scroll-smooth">
        <div className="max-w-6xl mx-auto space-y-6">

          {/* TAB 1: SPRINT PLANNER */}
          {activeTab === 'sprint' && (
            <div className="space-y-6">
              <div
                className="rounded-lg border border-white/[0.08] bg-[#0c1017] p-6"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-white/[0.07] gap-2">
                  <div>
                    <h3 className="text-sm font-semibold text-white">Plan sprint tasks</h3>
                    <p className="mt-0.5 text-xs text-neutral-400">
                      Describe a feature to get a first draft of sprint tasks.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {(epicTitle || epicDesc || generatedTasks.length > 0) && (
                      <button
                        type="button"
                        onClick={handleClearForm}
                        className="flex items-center gap-1.5 rounded-md border border-white/[0.08] bg-white/[0.02] px-2.5 py-1 text-[11px] text-neutral-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
                        title="Clear all fields and generated tasks"
                      >
                        <Trash2 className="h-3 w-3" />
                        <span>Clear</span>
                      </button>
                    )}
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
                      <span>Feature title</span>
                      <span className="text-[10px] text-neutral-500">Required</span>
                    </label>
                    <input
                      type="text"
                      value={epicTitle}
                      onChange={(e) => setEpicTitle(e.target.value)}
                      placeholder="e.g. Add password reset"
                      className="w-full rounded-lg border border-white/[0.1] bg-[#080b11] px-3.5 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none transition-all"
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = roleTheme.accentHex;
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                      }}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-1.5 flex items-center justify-between">
                      <span>Technical Scope & Constraints</span>
                      <span className="text-[10px] text-neutral-500">Optional</span>
                    </label>
                    <textarea
                      rows={2}
                      value={epicDesc}
                      onChange={(e) => setEpicDesc(e.target.value)}
                      placeholder="Add any important requirements or constraints"
                      className="w-full rounded-lg border border-white/[0.1] bg-[#080b11] px-3.5 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none transition-all resize-none"
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = roleTheme.accentHex;
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                      }}
                    />
                  </div>
                </div>

                {/* Flow Button Call to Action */}
                <div className="mt-5 flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-white/[0.07]">
                  <div className="flex items-center gap-2 text-xs text-neutral-400">
                    <span>Review the draft before adding tasks to your backlog.</span>
                  </div>

                  <FlowButton
                    text={isGeneratingSprint ? 'Creating draft...' : 'Create task draft'}
                    variant="accent"
                    size="md"
                    accentColor={roleTheme.accentHex}
                    onClick={handleGenerateSprint}
                    disabled={isGeneratingSprint}
                    icon={Plus}
                  />
                </div>
              </div>

              {/* Generated Task Cards Grid */}
              {generatedTasks.length > 0 && (
                <div className="space-y-4 pt-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold text-neutral-300">
                        Draft tasks
                      </h4>
                      <span
                        className="rounded-full px-2 py-0.5 text-[11px] font-semibold"
                        style={{
                          backgroundColor: `rgba(${roleTheme.accentRgb}, 0.15)`,
                          color: roleTheme.accentHex,
                        }}
                      >
                        {generatedTasks.length}
                      </span>
                    </div>
                    <span className="text-xs text-neutral-500">
                      Add any tasks you want to keep to your backlog.
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
                          : 'text-neutral-300 bg-white/[0.04] border-white/[0.1]';

                      return (
                        <div
                          key={idx}
                          className="group relative rounded-lg border border-white/[0.08] bg-[#0c1017] p-4 flex flex-col justify-between space-y-4 transition-colors duration-200 hover:border-white/[0.18]"
                        >
                          <div>
                            <div className="flex items-center justify-between mb-2.5">
                              {t.priority && (
                                <span className={`rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${priorityColor}`}>
                                  {t.priority}
                                </span>
                              )}
                              {t.estimateHours != null && (
                                <div className="flex items-center gap-1 text-xs text-neutral-400">
                                  <Clock className="h-3 w-3 text-neutral-500" />
                                  <span>{t.estimateHours}h</span>
                                </div>
                              )}
                            </div>

                            <h5 className="font-semibold text-sm text-white leading-snug">
                              {t.title}
                            </h5>
                            <p className="text-sm text-neutral-400 mt-2 leading-relaxed line-clamp-3">
                              {t.description}
                            </p>

                            <div className="flex flex-wrap gap-1.5 mt-3">
                              {(t.tags || []).map((tag: string, i: number) => (
                                <span
                                  key={i}
                                  className="rounded-md border border-white/[0.06] bg-white/[0.03] px-2 py-0.5 text-[11px] text-neutral-400"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>

                          <div className="pt-2 border-t border-white/[0.06]">
                            <FlowButton
                              text={isAdded ? 'Added to backlog' : 'Add to backlog'}
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
            </div>
          )}

          {/* TAB 2: ARCHITECTURE REVIEW */}
          {activeTab === 'audit' && (
            <div className="space-y-6">
              <div
                className="rounded-lg border border-white/[0.08] bg-[#0c1017] p-6"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-white/[0.07] gap-2">
                  <div>
                    <h3 className="text-sm font-semibold text-white">Review code or design</h3>
                    <p className="mt-0.5 text-xs text-neutral-400">
                      Ask Gemini to review your code or design and point out problems.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {(auditPrompt || auditResult || auditError) && (
                      <button
                        type="button"
                        onClick={handleClearAudit}
                        className="flex items-center gap-1.5 rounded-md border border-white/[0.08] bg-white/[0.02] px-2.5 py-1 text-[11px] text-neutral-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
                        title="Clear audit results"
                      >
                        <Trash2 className="h-3 w-3" />
                        <span>Clear</span>
                      </button>
                    )}
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
                        className={`group relative rounded-lg border p-4 text-left transition-colors duration-200 cursor-pointer ${
                          isSelected
                            ? 'bg-white/[0.05]'
                            : 'border-white/[0.08] bg-[#090b10] hover:border-white/[0.16] hover:bg-white/[0.02]'
                        }`}
                        style={
                          isSelected
                            ? {
                                borderColor: 'rgba(255,255,255,0.22)',
                              }
                            : {}
                        }
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="font-medium text-sm text-white group-hover:text-neutral-100">
                          {t.title}
                          </div>
                          {isSelected && <CheckCircle2 className="h-4 w-4 flex-shrink-0" style={{ color: accentColor }} />}
                        </div>
                        <div className="text-sm text-neutral-400 mt-2 leading-relaxed">
                          {t.desc}
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-5">
                  <label className="block text-xs font-semibold text-neutral-300 mb-1.5 flex items-center justify-between">
                    <span>Additional context (optional)</span>
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Paste code or describe what you want reviewed"
                    value={auditPrompt}
                    onChange={(e) => setAuditPrompt(e.target.value)}
                    className="w-full rounded-lg border border-white/[0.1] bg-[#080b11] px-3.5 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none transition-all resize-none"
                    style={{ borderColor: 'rgba(255,255,255,0.1)' }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = roleTheme.accentHex;
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                    }}
                  />
                </div>

                {/* Audit Action with Flow Button */}
                {auditError && (
                  <div role="alert" className="mt-4 rounded-lg border border-rose-500/30 bg-rose-500/[0.08] px-3.5 py-3 text-sm text-rose-300">
                    {auditError}
                  </div>
                )}
                <div className="mt-5 flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-white/[0.07]">
                  <div className="flex items-center gap-2 text-xs text-neutral-400">
                  </div>

                  <FlowButton
                    text={isAuditing ? 'Reviewing...' : 'Run review'}
                    variant="accent"
                    size="md"
                    accentColor={roleTheme.accentHex}
                    onClick={handleRunAudit}
                    disabled={isAuditing}
                    icon={Play}
                  />
                </div>
              </div>

              {/* Audit Result Display */}
              {auditResult && (
                <div
                  className="rounded-lg border border-white/[0.1] bg-[#0c1017] p-6"
                >
                  <div className="flex items-center justify-between pb-3.5 border-b border-white/[0.07] mb-4">
                    <div className="flex items-center gap-2.5 font-semibold text-sm text-white">
                      <span>Review results</span>
                    </div>
                    <span
                      className="rounded-md border border-white/10 bg-white/[0.03] px-2.5 py-0.5 text-[11px] text-neutral-300"
                    >
                      {auditResult.modelUsed}
                    </span>
                  </div>

                  {auditResult.modelUsed?.includes('Offline Mode') && (
                    <div className="mb-4 rounded-lg border border-amber-500/20 bg-amber-500/[0.06] px-3.5 py-3 text-sm text-amber-200">
                      The AI service was unavailable. This is offline guidance, not a Gemini review.
                    </div>
                  )}

                  {auditResult.error ? (
                    <div className="text-xs text-rose-400 bg-rose-500/10 p-4 rounded-xl border border-rose-500/30">
                      {auditResult.error}
                    </div>
                  ) : (
                    <div className="text-sm leading-relaxed text-neutral-200 whitespace-pre-wrap bg-[#080b11] p-4 rounded-lg border border-white/[0.06] selection:bg-emerald-500/20">
                      {auditResult.analysis}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: KNOWLEDGE BASE */}
          {activeTab === 'interview' && (
            <div className="space-y-6">
              <div
                className="rounded-lg border border-white/[0.08] bg-[#0c1017] p-6"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-white/[0.07] gap-2">
                  <div>
                    <h3 className="text-sm font-semibold text-white">Learn a technical topic</h3>
                    <p className="mt-0.5 text-xs text-neutral-400">
                      Choose a topic to get a concise guide with examples.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {(qaResult || qaError) && (
                      <button
                        type="button"
                        onClick={handleClearGuide}
                        className="flex items-center gap-1.5 rounded-md border border-white/[0.08] bg-white/[0.02] px-2.5 py-1 text-[11px] text-neutral-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
                        title="Clear generated guide"
                      >
                        <Trash2 className="h-3 w-3" />
                        <span>Clear</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Categories */}
                <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  {KNOWLEDGE_CATEGORIES.map((cat) => {
                    const isSelected = interviewCat.includes(cat.id.split(' ')[0]);
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setInterviewCat(cat.id)}
                        className={`group flex items-center gap-2.5 rounded-lg border p-3 text-left transition-colors duration-200 cursor-pointer ${
                          isSelected
                            ? 'bg-white/[0.05]'
                            : 'border-white/[0.08] bg-[#090b10] hover:border-white/[0.16] hover:bg-white/[0.02]'
                        }`}
                        style={
                          isSelected
                            ? {
                                borderColor: 'rgba(255,255,255,0.22)',
                                color: '#ffffff',
                              }
                            : {
                                color: '#9ba3b4',
                              }
                        }
                      >
                        <span className="text-xs font-semibold">{cat.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Flow Button Call to Action */}
                <div className="mt-5 flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-white/[0.07]">
                  <div className="flex items-center gap-2 text-xs text-neutral-400">
                    <span>Use the guide as a starting point, then verify details for your project.</span>
                  </div>

                  {qaError && (
                    <div role="alert" className="text-sm text-rose-300">
                      {qaError}
                    </div>
                  )}
                  <FlowButton
                    text={isGeneratingQA ? 'Creating guide...' : 'Create guide'}
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
                  className="rounded-lg border border-white/[0.1] bg-[#0c1017] p-6"
                >
                  <div className="flex items-center justify-between pb-3.5 border-b border-white/[0.07] mb-4">
                    <div className="flex items-center gap-2.5 font-bold text-xs text-white">
                      <span>Guide</span>
                    </div>
                    <span className="text-xs text-neutral-400">
                      {KNOWLEDGE_CATEGORIES.find((category) => category.id === interviewCat)?.label}
                    </span>
                  </div>

                  <div className="text-sm leading-relaxed text-neutral-200 whitespace-pre-wrap bg-[#080b11] p-5 rounded-lg border border-white/[0.06] selection:bg-emerald-500/20">
                    {qaResult}
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default AiAssistant;
