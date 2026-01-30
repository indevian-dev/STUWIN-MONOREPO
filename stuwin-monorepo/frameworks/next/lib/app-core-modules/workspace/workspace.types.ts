
import type { Timestamps } from '../../../types/base';

// ═══════════════════════════════════════════════════════════════
// WORKSPACE MODULE TYPES
// ═══════════════════════════════════════════════════════════════

export type WorkspaceType = 'student' | 'provider' | 'staff' | 'parent' | 'tutor' | 'admin';

export interface Workspace {
    id: string;
    title: string;
    type: WorkspaceType;
    ownerAccountId: string;
    isActive: boolean;
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
    id: number;
    accountId: number;
    workspaceId: number;
    workspaceRoleId: number;
    isActive: boolean;
    createdAt: Date;
}

export interface WorkspaceRole {
    id: number;
    name: string;
    slug: string;
    permissions: any;
    forWorkspaceType: string;
}
