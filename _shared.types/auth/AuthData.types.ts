// ═══════════════════════════════════════════════════════════════
// AUTH TYPES — Source of Truth
// ═══════════════════════════════════════════════════════════════
// All auth-related types derive from these building blocks.
// Change a field here → TypeScript errors propagate everywhere.
// ═══════════════════════════════════════════════════════════════

// ─── Building Blocks ─────────────────────────────────────────

/** Core user identity fields */
export interface AuthUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  emailVerified: boolean;
  phoneVerified: boolean;
}

/** Account + workspace access fields */
export interface AuthAccount {
  id: string;
  role?: string;
  permissions?: string[];
  workspaceId?: string;
  workspaceType?: string;
  subscriptionTier?: string;
  subscribedUntil?: number;
}

/** Active session metadata */
export interface AuthSession {
  id: string;
  userId: string;
  accountId: string;
  createdAt: string;
  lastActivityAt: string;
}

// ─── Client-Safe Type (web + mobile) ─────────────────────────

/**
 * ClientAuthData — subset of auth info safe for client-side rendering.
 * Derived from AuthUser/AuthAccount via Pick — changes propagate automatically.
 */
export type ClientAuthData = {
  user: Pick<AuthUser, 'id' | 'email' | 'firstName' | 'lastName'>;
  account: Pick<AuthAccount, 'id' | 'workspaceType' | 'role'>;
};

// ─── Service-Layer Context (derived) ─────────────────────────

/**
 * AuthContext — slim identity for service/repository injection.
 * Field types are index-linked to AuthUser/AuthAccount.
 */
export interface AuthContext {
  userId: AuthUser['id'];
  accountId: AuthAccount['id'];
  permissions?: AuthAccount['permissions'];
  activeWorkspaceId?: AuthAccount['workspaceId'];
  workspaceType?: AuthAccount['workspaceType'];
  role?: AuthAccount['role'];
  subscriptionActive?: boolean;
}

// ─── Client Auth Management Payload ──────────────────────────

/**
 * AuthContextPayload — used for client-side auth state transitions
 * (login, register, switch account, etc.)
 */
export interface AuthContextPayload {
  action: 'login' | 'register' | 'switch_account' | 'refresh' | 'verify' | 'logout' | 'initial';
  user?: {
    id: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    emailVerified?: boolean;
    phoneVerified?: boolean;
  };
  account?: {
    id: string;
    subscribedUntil?: string;
    subscriptionType?: string;
    workspaceSubscribedUntil?: string;
    workspaceSubscriptionType?: string;
  };
  workspaces?: Array<{
    id: string;
    type: string;
    title: string;
    displayName?: string;
  }>;
  workspaceId?: string;
  workspaceRole?: string;
  isPhoneVerified?: boolean;
}
