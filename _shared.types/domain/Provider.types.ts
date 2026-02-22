import type { Timestamps } from '../base/Base.types';

export namespace Provider {
    export interface PrivateAccess extends Timestamps {
        id: string;
        title: string;
        tenantType: string;
        description?: string;
        email?: string;
        phone?: string;
        website?: string;
        logo?: string;
        location?: {
            country?: string;
            city?: string;
            address?: string;
        };
        totalStudents?: number;
        totalStaff?: number;
        isActive: boolean;
        isApproved: boolean;
        metadata?: Record<string, any>;
    }

    export interface CreateInput {
        title: string;
        tenantType: string;
        description?: string;
        email?: string;
        phone?: string;
        website?: string;
        logo?: string;
    }

    export interface UpdateInput extends Partial<CreateInput> {
        location?: {
            country?: string;
            city?: string;
            address?: string;
        };
    }
}
