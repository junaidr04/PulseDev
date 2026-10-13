export interface EnterpriseUser {
  _id: string;
  name: string;
  email: string;
  role: 'admin' | 'lead' | 'developer' | 'qa' | 'guest';
  avatar: string;
  title: string;
  department: string;
}

export interface RolePermissions {
  canCreateProject: boolean;
  canDeleteTask: boolean;
  canApproveToDone: boolean;
  canViewSecurityAudit: boolean;
  isReadOnly: boolean;
}

export const getRolePermissions = (role: EnterpriseUser['role']): RolePermissions => ({
  canCreateProject: role === 'admin',
  canDeleteTask: role === 'admin' || role === 'lead',
  canApproveToDone: role === 'admin' || role === 'lead' || role === 'qa',
  canViewSecurityAudit: role === 'admin',
  isReadOnly: role === 'guest',
});
