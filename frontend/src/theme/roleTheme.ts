import { useEffect } from 'react';

export type RoleKey = 'admin' | 'lead' | 'developer' | 'qa' | 'guest';

export interface RoleThemeConfig {
  role: RoleKey;
  roleTitle: string;
  tagline: string;
  accentHex: string;
}

const accentHex = '#83a897';

export const roleConfig: Record<RoleKey, RoleThemeConfig> = {
  admin: {
    role: 'admin',
    roleTitle: 'Admin',
    tagline: 'Manage the workspace and review activity.',
    accentHex,
  },
  lead: {
    role: 'lead',
    roleTitle: 'Team lead',
    tagline: 'Review work and help the team move issues forward.',
    accentHex,
  },
  developer: {
    role: 'developer',
    roleTitle: 'Developer',
    tagline: 'See your assigned work and update its status.',
    accentHex,
  },
  qa: {
    role: 'qa',
    roleTitle: 'QA',
    tagline: 'Check issues in review and record the result.',
    accentHex,
  },
  guest: {
    role: 'guest',
    roleTitle: 'Product manager',
    tagline: 'Track projects and review team progress.',
    accentHex,
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

export function useSyncRoleCssVariables(rawRole?: string | null) {
  const theme = getRoleTheme(rawRole);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--role-accent', theme.accentHex);
    root.setAttribute('data-role-theme', theme.role);
  }, [theme]);

  return theme;
}

export default roleConfig;
