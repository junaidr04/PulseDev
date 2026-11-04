import { useEffect } from 'react';

export type RoleKey = 'admin' | 'lead' | 'developer' | 'qa' | 'guest';

export interface RoleThemeConfig {
  role: RoleKey;
  personaName: string;
  roleTitle: string;
  shortBadge: string;
  cockpitTitle: string;
  tagline: string;
  accentHex: string;
  accentSecondaryHex: string;
  accentRgb: string;
  gradientCss: string;
  conicBorderCss: string;
  radialBackdropCss: string;
  textAccentClass: string;
  bgAccentSubtleClass: string;
  borderAccentClass: string;
  buttonGradientClass: string;
  badgeClass: string;
  ringColor: string;
}

export const roleConfig: Record<RoleKey, RoleThemeConfig> = {
  admin: {
    role: 'admin',
    personaName: 'Alex Chen',
    roleTitle: 'Principal Architect',
    shortBadge: 'ADMIN · ARCHITECT',
    cockpitTitle: 'Command Center',
    tagline: 'System Architecture, Multi-Region SLA Telemetry & Governance Sign-off',
    accentHex: '#10B981',
    accentSecondaryHex: '#14B8A6',
    accentRgb: '16, 185, 129',
    gradientCss: 'linear-gradient(135deg, #10B981 0%, #14B8A6 55%, #06B6D4 100%)',
    conicBorderCss:
      'conic-gradient(from var(--angle, 0deg), rgba(16,185,129,0.08), rgba(16,185,129,0.75), rgba(20,184,166,0.5), rgba(16,185,129,0.08))',
    radialBackdropCss:
      'radial-gradient(900px circle at 18% 0%, rgba(16, 185, 129, 0.12), rgba(20, 184, 166, 0.04) 45%, transparent 75%)',
    textAccentClass: 'text-emerald-400',
    bgAccentSubtleClass: 'bg-emerald-500/10',
    borderAccentClass: 'border-emerald-500/30',
    buttonGradientClass: 'from-emerald-400 via-teal-400 to-cyan-400',
    badgeClass: 'border-emerald-500/35 bg-emerald-500/12 text-emerald-300',
    ringColor: '#10B981',
  },
  lead: {
    role: 'lead',
    personaName: 'Priya Patel',
    roleTitle: 'Staff Backend Lead',
    shortBadge: 'LEAD · BACKEND',
    cockpitTitle: 'Service Health & Review Hub',
    tagline: 'PR Review Queue, Service Latency Telemetry, Webhook Throughput & Canary Pipelines',
    accentHex: '#A78BFA',
    accentSecondaryHex: '#818CF8',
    accentRgb: '167, 139, 250',
    gradientCss: 'linear-gradient(135deg, #A78BFA 0%, #8B5CF6 55%, #6366F1 100%)',
    conicBorderCss:
      'conic-gradient(from var(--angle, 0deg), rgba(167,139,250,0.08), rgba(167,139,250,0.8), rgba(129,140,248,0.5), rgba(167,139,250,0.08))',
    radialBackdropCss:
      'radial-gradient(900px circle at 22% 0%, rgba(167, 139, 250, 0.13), rgba(99, 102, 241, 0.05) 45%, transparent 75%)',
    textAccentClass: 'text-violet-400',
    bgAccentSubtleClass: 'bg-violet-500/10',
    borderAccentClass: 'border-violet-500/30',
    buttonGradientClass: 'from-violet-400 via-purple-400 to-indigo-400',
    badgeClass: 'border-violet-500/35 bg-violet-500/12 text-violet-300',
    ringColor: '#A78BFA',
  },
  developer: {
    role: 'developer',
    personaName: 'Marcus Vance',
    roleTitle: 'Senior Software Engineer',
    shortBadge: 'DEV · ENGINEER',
    cockpitTitle: 'My Focus Mode',
    tagline: 'Distraction-Free Deep Work, Active Issue Timer, Subtask Execution & Keyboard Flow',
    accentHex: '#22D3EE',
    accentSecondaryHex: '#38BDF8',
    accentRgb: '34, 211, 238',
    gradientCss: 'linear-gradient(135deg, #22D3EE 0%, #06B6D4 55%, #38BDF8 100%)',
    conicBorderCss:
      'conic-gradient(from var(--angle, 0deg), rgba(34,211,238,0.08), rgba(34,211,238,0.8), rgba(56,189,248,0.5), rgba(34,211,238,0.08))',
    radialBackdropCss:
      'radial-gradient(900px circle at 50% 0%, rgba(34, 211, 238, 0.11), rgba(56, 189, 248, 0.04) 45%, transparent 75%)',
    textAccentClass: 'text-cyan-400',
    bgAccentSubtleClass: 'bg-cyan-500/10',
    borderAccentClass: 'border-cyan-500/30',
    buttonGradientClass: 'from-cyan-400 via-sky-400 to-teal-300',
    badgeClass: 'border-cyan-500/35 bg-cyan-500/12 text-cyan-300',
    ringColor: '#22D3EE',
  },
  qa: {
    role: 'qa',
    personaName: 'Sophia Laurent',
    roleTitle: 'QA Automation Lead',
    shortBadge: 'QA · QUALITY GATE',
    cockpitTitle: 'Quality Gate Lab',
    tagline: 'Verification Pipeline, Automated Regression Matrix, Flaky Spec Detection & Release Sign-off',
    accentHex: '#FBBF24',
    accentSecondaryHex: '#F59E0B',
    accentRgb: '251, 191, 36',
    gradientCss: 'linear-gradient(135deg, #FBBF24 0%, #F59E0B 55%, #FB923C 100%)',
    conicBorderCss:
      'conic-gradient(from var(--angle, 0deg), rgba(251,191,36,0.08), rgba(251,191,36,0.8), rgba(245,158,11,0.5), rgba(251,191,36,0.08))',
    radialBackdropCss:
      'radial-gradient(900px circle at 25% 0%, rgba(251, 191, 36, 0.12), rgba(245, 158, 11, 0.04) 45%, transparent 75%)',
    textAccentClass: 'text-amber-400',
    bgAccentSubtleClass: 'bg-amber-500/10',
    borderAccentClass: 'border-amber-500/30',
    buttonGradientClass: 'from-amber-400 via-yellow-400 to-orange-400',
    badgeClass: 'border-amber-500/35 bg-amber-500/12 text-amber-300',
    ringColor: '#FBBF24',
  },
  guest: {
    role: 'guest',
    personaName: 'Jordan Blake',
    roleTitle: 'Product Manager',
    shortBadge: 'PM · PRODUCT STUDIO',
    cockpitTitle: 'Roadmap & Delivery Studio',
    tagline: 'Quarterly Initiative Timeline, OKR Velocity, Merchant Conversion Funnel & Stakeholder Sign-off',
    accentHex: '#FB7185',
    accentSecondaryHex: '#F43F5E',
    accentRgb: '251, 113, 133',
    gradientCss: 'linear-gradient(135deg, #FB7185 0%, #F43F5E 55%, #EC4899 100%)',
    conicBorderCss:
      'conic-gradient(from var(--angle, 0deg), rgba(251,113,133,0.08), rgba(251,113,133,0.8), rgba(244,63,94,0.5), rgba(251,113,133,0.08))',
    radialBackdropCss:
      'radial-gradient(900px circle at 30% 0%, rgba(251, 113, 133, 0.12), rgba(244, 63, 94, 0.04) 45%, transparent 75%)',
    textAccentClass: 'text-rose-400',
    bgAccentSubtleClass: 'bg-rose-500/10',
    borderAccentClass: 'border-rose-500/30',
    buttonGradientClass: 'from-rose-400 via-pink-400 to-orange-300',
    badgeClass: 'border-rose-500/35 bg-rose-500/12 text-rose-300',
    ringColor: '#FB7185',
  },
};

export function resolveRoleKey(rawRole?: string | null): RoleKey {
  if (!rawRole) return 'admin';
  const normalized = rawRole.toLowerCase();
  if (normalized === 'lead') return 'lead';
  if (normalized === 'developer') return 'developer';
  if (normalized === 'qa') return 'qa';
  if (normalized === 'guest' || normalized === 'pm' || normalized === 'product') return 'guest';
  return 'admin';
}

export function getRoleTheme(rawRole?: string | null): RoleThemeConfig {
  return roleConfig[resolveRoleKey(rawRole)];
}

/**
 * Syncs the active user's role theme into root CSS variables (--role-accent, --role-accent-rgb, --role-gradient)
 * so cards, hover lifts, borders, and ambient scanlines automatically adapt on login or account switch.
 */
export function useSyncRoleCssVariables(rawRole?: string | null) {
  const theme = getRoleTheme(rawRole);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--role-accent', theme.accentHex);
    root.style.setProperty('--role-accent-secondary', theme.accentSecondaryHex);
    root.style.setProperty('--role-accent-rgb', theme.accentRgb);
    root.style.setProperty('--role-gradient', theme.gradientCss);
    root.setAttribute('data-role-theme', theme.role);
  }, [theme]);

  return theme;
}

export default roleConfig;
