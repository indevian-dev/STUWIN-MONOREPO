export interface Timestamps {
    createdAt: Date;
    updatedAt: Date;
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

// ═══════════════════════════════════════════════════════════════
// ACCOUNT
// ═══════════════════════════════════════════════════════════════

export interface AccountPrivateAccess extends Timestamps {
    id: string;
    userId: string;
    suspended: boolean;
}

// ═══════════════════════════════════════════════════════════════
// INPUT TYPES
// ═══════════════════════════════════════════════════════════════

export interface UserCreateInput {
    email: string;
    password: string;
    name?: string;
    lastName?: string;
    phone?: string;
}
