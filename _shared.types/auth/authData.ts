// Auth Data, Auth Context, and JWT Payload types

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
  sessionId: string;
  emailVerified: boolean;
  phoneVerified: boolean;
}

// Auth Context (simplified for service layer)

export interface AuthContext {
  userId: string;
  accountId: string;
  activeWorkspaceId?: string;
  workspaceType?: string;
  role?: string;
  permissions?: string[];
  subscriptionActive?: boolean;
}

// Auth Context Payload (client-side auth management)

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
