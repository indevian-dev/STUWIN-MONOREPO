// ═══════════════════════════════════════════════════════════════
// PERMISSIONS & ROLES TYPES
// ═══════════════════════════════════════════════════════════════
// Types for role-based access control (RBAC)

export interface Permission {
  id: string;
  name: string;
  description: string;
  resource: string;
  action: string;
  scope?: string[];
}

export interface Role {
  id: string;
  name: string;
  description?: string;
  permissions: Permission[];
  isSystem: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface PermissionCheck {
  resource: string;
  action: string;
  scope?: string;
  userId?: string;
  accountId?: string;
}

// ═══════════════════════════════════════════════════════════════
// ACCESS CONTROL
// ═══════════════════════════════════════════════════════════════

export enum AccessScopeType {
  PUBLIC = 'public',
  STUDENT = 'student',
  PROVIDER = 'provider',
  EDUORG = 'eduorg',
  STAFF = 'staff',
}

export interface AccessScope {
  type: AccessScopeType;
  key?: string; // specific scope identifier
  permissions: string[];
}

export interface AccessControlDecision {
  granted: boolean;
  reason?: string;
  requiredPermissions?: string[];
  userPermissions?: string[];
  scope?: AccessScope;
}

