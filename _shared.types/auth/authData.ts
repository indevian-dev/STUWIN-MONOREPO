// Auth Data, Auth Context, and JWT Payload types

import type { Account, User } from '../domain/user';
import type { Session } from './session';

/**
 * AuthData - Workspace-based auth context
 * Contains user, account, and workspace information
 */
export interface AuthData {
  user: {
    id: string;
    email: string;
  };
  account: {
    id: string;
    suspended?: boolean;
  };
  workspace: {
    type: 'student' | 'provider' | 'eduorg' | 'staff';
    id: string;
    role: string;
  };
  permissions: string[];
  frequentlyUsedWorkspaces: string[];
  sessionId: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  twoFactorEnabled: boolean;
  session?: {
    id: string;
  };
}

/**
 * Legacy: For backward compatibility during migration
 */
export interface LegacyAuthData extends AuthData {
  account: AuthData['account'] & {
    workspaceId?: string;
    workspaceType?: string;
  };
}

// Account Suspension & Moderation

export interface AccountSuspension {
  isSuspended: boolean;
  reason?: string;
  suspendedAt?: string;
  suspendedBy?: string;
  suspensionExpiresAt?: string;
  canAppeal: boolean;
}

export interface ModerationLog {
  id: string;
  accountId: string;
  action: 'suspend' | 'unsuspend' | 'warn' | 'ban';
  reason: string;
  performedBy: string;
  performedAt: string;
  metadata?: Record<string, any>;
}

// Auth Context (simplified for service layer)

export interface AuthContext {
  userId: string;
  accountId: string;
  activeWorkspaceId?: string;
  allowedWorkspaceIds: string[];
  permissions?: string[];
  allowedKeys?: string[];
  activeKey?: string;
}

// Auth Context Payload (client-side auth management)

export interface AuthContextPayload {
  action: 'login' | 'register' | 'switch_account' | 'refresh' | 'verify' | 'logout' | 'initial';
  user?: User.PrivateAccess;
  account?: Account.PrivateAccess;
  workspaces?: Array<{
    id: string;
    type: string;
    title: string;
    displayName?: string;
  }>;
  workspaceId?: string;
  workspaceRole?: string;
  isPhoneVerified?: boolean;
  session?: Session | null;
}

// JWT Access Token Payload

export interface AccessTokenPayload {
  accountId: string;
  userId: string;
  permissions: string[];
  iat: number;
  exp: number;
  uid?: string;
  aid?: string;
  sid?: string;
  name?: string;
  email?: string;
  phone?: string;
  emailVerified?: boolean;
  phoneVerified?: boolean;
  personal?: boolean;
  role?: string;
  suspended?: boolean;
  workspaceType?: string;
  workspaceId?: string;
  domain?: string;
  frequentlyUsedWorkspaces?: string[];
}
