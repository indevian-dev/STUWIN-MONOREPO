export interface Timestamps {
    createdAt: Date;
    updatedAt: Date;
}

export interface Session {
    id: string;
    sessionsGroupId: string;
    accountId: string;
    expireAt: Date;
    ip?: string;
    device?: string;
    browser?: string;
    os?: string;
    metadata?: Record<string, unknown>;
}

// ═══════════════════════════════════════════════════════════════
// AUTH MODULE TYPES
// ═══════════════════════════════════════════════════════════════

export type UserId = string & { readonly __brand: 'UserId' };
export type AccountId = string & { readonly __brand: 'AccountId' };

// ═══════════════════════════════════════════════════════════════
// USER
// ═══════════════════════════════════════════════════════════════

export interface UserPrivateAccess extends Timestamps {
    id: string;
    email: string;
    name?: string;
    lastName?: string;
    phone?: string;
    emailVerified: boolean;
    phoneVerified: boolean;
    provider?: string;
    fullName: string;
    isActive: boolean;
}

export interface UserCreateInput {
    email: string;
    password: string;
    name?: string;
    lastName?: string;
    phone?: string;
    provider?: string;
}

// ═══════════════════════════════════════════════════════════════
// ACCOUNT
// ═══════════════════════════════════════════════════════════════

export interface AccountPrivateAccess extends Timestamps {
    id: string;
    userId: string;
    suspended: boolean;
}

export interface AccountCreateInput {
    userId: string;
    isPersonal?: boolean;
    role?: string;
}

