import type { Timestamps } from '../common/base';

export interface Organization extends Timestamps {
    id: string;
    name: string;
    description?: string;
    logo?: string;
    cover?: string;
    website?: string;
    email?: string;
    phone?: string;
    isActive: boolean;
    isApproved: boolean;
    isPlatform: boolean;
    metadata?: Record<string, any>;
}

export interface OrganizationCreateInput {
    name: string;
    description?: string;
    logo?: string;
}
