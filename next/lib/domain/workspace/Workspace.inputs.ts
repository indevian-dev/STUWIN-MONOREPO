
import { z } from "zod";
import type { CreateWorkspaceRequest, WorkspaceType } from "./Workspace.types";

// ═══════════════════════════════════════════════════════════════
// WORKSPACE INPUT SCHEMAS
// ═══════════════════════════════════════════════════════════════

const workspaceTypeSchema = z.enum(['student', 'provider', 'admin', 'staff', 'parent']);

// ─── WORKSPACE ─────────────────────────────────────────────────

export const WorkspaceCreateSchema = z.object({
    workspaceType: workspaceTypeSchema,
    title: z.string().min(2).max(255),
    description: z.string().optional(),
}) satisfies z.ZodType<CreateWorkspaceRequest>;

export type WorkspaceCreateInput = z.infer<typeof WorkspaceCreateSchema>;

export const WorkspaceUpdateSchema = z.object({
    title: z.string().min(2).max(255).optional(),
    isActive: z.boolean().optional(),
    providerSubscriptionPrice: z.number().nullable().optional(),
    providerProgramDescription: z.string().nullable().optional(),
    providerSubscriptionPeriod: z.enum(['month', 'year']).optional(),
    providerTrialDaysCount: z.number().default(0).optional(),
    currency: z.string().optional(),
    features: z.array(z.string()).optional(),
    monthlyPrice: z.number().optional(),
    yearlyPrice: z.number().optional(),
    logo: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().optional(),
    website: z.string().optional(),
    location: z.object({
        address: z.string().optional(),
        city: z.string().optional(),
    }).optional(),
});

export type WorkspaceUpdateInput = z.infer<typeof WorkspaceUpdateSchema>;

// ─── ROLE ──────────────────────────────────────────────────────

export const RoleCreateSchema = z.object({
    name: z.string().min(2),
    permissions: z.record(z.any()),
    forWorkspaceType: workspaceTypeSchema,
});

export type RoleCreateInput = z.infer<typeof RoleCreateSchema>;

// ─── MEMBERSHIP ────────────────────────────────────────────────

export const MembershipCreateSchema = z.object({
    accountId: z.string(),
    workspaceId: z.string(),
    workspaceRoleId: z.string(),
    isActive: z.boolean().default(true),
});

export type MembershipCreateInput = z.infer<typeof MembershipCreateSchema>;
