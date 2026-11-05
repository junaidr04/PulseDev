export type Permission =
  | 'profile.read'
  | 'profile.update.self'
  | 'team.read'
  | 'team.manage'
  | 'users.manage'
  | 'audit.read'
  | 'projects.manage'
  | 'tasks.read'
  | 'tasks.write'
  | 'tasks.delete';

export const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  guest: [
    'profile.read',
    'profile.update.self',
    'team.read',
    'projects.manage',
    'tasks.read',
    'tasks.write',
  ],
  developer: [
    'profile.read',
    'profile.update.self',
    'team.read',
    'projects.manage',
    'tasks.read',
    'tasks.write',
  ],
  qa: [
    'profile.read',
    'profile.update.self',
    'team.read',
    'projects.manage',
    'tasks.read',
    'tasks.write',
  ],
  lead: [
    'profile.read',
    'profile.update.self',
    'team.read',
    'team.manage',
    'projects.manage',
    'tasks.read',
    'tasks.write',
    'tasks.delete',
  ],
  admin: [
    'profile.read',
    'profile.update.self',
    'team.read',
    'team.manage',
    'users.manage',
    'audit.read',
    'projects.manage',
    'tasks.read',
    'tasks.write',
    'tasks.delete',
  ],
};

export function getPermissionsForRole(role: string): Permission[] {
  return ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.guest;
}

export function hasAuthorizedRole(role: string, allowedRoles: readonly string[]): boolean {
  return allowedRoles.includes(role);
}
