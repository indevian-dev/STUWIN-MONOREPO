// ═══════════════════════════════════════════════════════════════
// AUTH DATA TYPES
// ═══════════════════════════════════════════════════════════════
// Core authentication data structure used throughout the application

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
  // Workspace context from JWT/URL params
  workspace: {
    type: 'student' | 'provider' | 'eduorg' | 'staff';
    id: string;
    role: string; // Role name in this workspace
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

// ═══════════════════════════════════════════════════════════════
// ACCOUNT SUSPENSION & MODERATION
// ═══════════════════════════════════════════════════════════════

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

