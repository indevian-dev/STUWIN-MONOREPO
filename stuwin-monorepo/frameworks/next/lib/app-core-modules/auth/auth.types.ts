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
    metadata?: any;
}

// ═══════════════════════════════════════════════════════════════
// AUTH MODULE TYPES
// ═══════════════════════════════════════════════════════════════

export type UserId = string & { readonly __brand: 'UserId' };
export type AccountId = string & { readonly __brand: 'AccountId' };

// ═══════════════════════════════════════════════════════════════
// USER
// ═══════════════════════════════════════════════════════════════

export namespace User {
    export interface PrivateAccess extends Timestamps {
        id: string;
        email: string;
        name?: string;
        lastName?: string;
        phone?: string;
        emailVerified: boolean;
        phoneVerified: boolean;
        avatarUrl?: string;
        provider?: string;
        fullName: string;
        isActive: boolean;
        sessions: Session[];
    }

    export interface CreateInput {
        email: string;
        password: string;
        name?: string;
        lastName?: string;
        phone?: string;
        provider?: string;
    }
}

// ═══════════════════════════════════════════════════════════════
// ACCOUNT
// ═══════════════════════════════════════════════════════════════

export namespace Account {
    export interface PrivateAccess extends Timestamps {
        id: string;
        userId: string;
        suspended: boolean;
    }

    export interface CreateInput {
        userId: string;
        isPersonal?: boolean;
        role?: string;
    }
}

// ═══════════════════════════════════════════════════════════════
// OTP
// ═══════════════════════════════════════════════════════════════

export type OtpType =
    | 'email_verification'
    | 'phone_verification'
    | 'password_reset'
    | '2fa_email'
    | '2fa_phone';

export interface OtpRecord {
    id: number;
    accountId: string | null;
    code: string | null;
    type: OtpType | null;
    expireAt: Date | null;
    createdAt: Date;
}
