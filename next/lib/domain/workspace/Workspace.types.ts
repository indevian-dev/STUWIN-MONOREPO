
import type { Timestamps } from '../base/Base.types';

// ═══════════════════════════════════════════════════════════════
// WORKSPACE MODULE TYPES
// ═══════════════════════════════════════════════════════════════

export type WorkspaceType = 'student' | 'provider' | 'staff' | 'parent' | 'admin';

export interface Workspace {
    id: string;
    title: string;
    type: WorkspaceType;
    isActive: boolean;
    profile?: any;
    createdAt: Date;
    updatedAt?: Date;
}

export interface WorkspaceListItem {
    workspaceId: string;
    workspaceType: WorkspaceType;
    title: string;
    description?: string;
    createdAt: string | Date;
    isActive: boolean;
}

export interface CreateWorkspaceRequest {
    workspaceType: WorkspaceType;
    title: string;
    description?: string;
}

// ═══════════════════════════════════════════════════════════════
// MEMBERSHIP & ROLE
// ═══════════════════════════════════════════════════════════════

export interface WorkspaceMembership {
    id: string;
    accountId: string;
    workspaceId: string;
    workspaceRoleId: string;
    isActive: boolean;
    createdAt: Date;
}

export interface WorkspaceRole {
    id: string;
    name: string;
    permissions: any;
    forWorkspaceType: string;
}

export interface ProviderListOptions {
    limit?: number;
    offset?: number;
    sortField?: 'title' | 'price' | 'createdAt' | string;
    orderDir?: 'asc' | 'desc';
    search?: string;
}

export interface WorkspaceProfile {
    type?: string;
    gradeLevel?: any;
    providerSubscriptionPrice?: number;
    providerTrialDaysCount?: number;
    [key: string]: any;
}

export interface CreateWorkspaceDetails {
    title: string;
    type: string;
    metadata?: any;
}

export interface ProviderApplicationDetails {
    title: string;
    metadata: any;
}

export interface CreateStudentWorkspaceDetails {
    displayName: string;
    gradeLevel?: any;
    providerId: string;
}
