// ═══════════════════════════════════════════════════════════════
// AUTH CONTEXT TYPES
// ═══════════════════════════════════════════════════════════════
// Types for authentication context payload used in client-side auth management

import type { Account, User } from './resources';
import type { Session } from './session';

// ═══════════════════════════════════════════════════════════════
// AUTH CONTEXT PAYLOAD
// ═══════════════════════════════════════════════════════════════

export interface AuthContextPayload {
  action: 'login' | 'register' | 'switch_account' | 'refresh' | 'verify' | 'logout';
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


export interface AuthContext {
  userId: string;
  accountId: string;
  activeWorkspaceId?: string;
  allowedWorkspaceIds: string[];
  permissions?: string[];
  allowedKeys?: string[];
  activeKey?: string;
}
