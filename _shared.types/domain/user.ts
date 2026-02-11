import type { Timestamps } from '../common/base';

export type UserId = string & { readonly __brand: 'UserId' };
export type AccountId = string & { readonly __brand: 'AccountId' };

export namespace User {
    export interface PrivateAccess extends Timestamps {
        id: string;
        email: string;
        firstName?: string;
        lastName?: string;
        phone?: string;
        emailVerified: boolean;
        phoneVerified: boolean;
        provider?: string;
        fullName: string;
        isActive: boolean;
        twoFactorEnabled: boolean;
    }

    export interface Profile {
        id: string;
        email: string;
        firstName?: string;
        lastName?: string;
        fullName?: string;
        phone?: string;
        lastSeenAt?: string;
        createdAt?: string;
    }

    export interface CreateInput {
        email: string;
        password: string;
        firstName?: string;
        lastName?: string;
        phone?: string;
        provider?: string;
    }
}

export namespace Account {
    export interface PrivateAccess extends Timestamps {
        id: string;
        userId: string;
        suspended: boolean;
        isPersonal: boolean;
        isStaff: boolean;
        subscriptionType?: string | null;
        subscribedUntil?: string | null;
        workspaceSubscriptionType?: string | null;
        workspaceSubscribedUntil?: string | null;
        preferences: {
            language: string;
            notifications: boolean;
        };
    }

    export interface CreateInput {
        userId: string;
        isPersonal?: boolean;
    }
}
