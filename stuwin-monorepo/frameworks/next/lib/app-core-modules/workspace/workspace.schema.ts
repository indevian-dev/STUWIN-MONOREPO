
import { z } from "zod";

/**
 * Zod schemas for Workspace module
 */

export const workspaceTypeSchema = z.enum(['student', 'provider', 'admin']);

export const workspaceSchema = z.object({
    id: z.string().optional(),
    title: z.string().min(2).max(255),
    type: workspaceTypeSchema,
    workspaceId: z.string().optional(),
    ownerAccountId: z.string(),
    isActive: z.boolean().default(true),
    studentSubscribedUntill: z.string().datetime().nullable().optional(),
    providerSubscriptionPrice: z.number().nullable().optional(),
    providerProgramDescription: z.string().nullable().optional(),
    providerSubscriptionPeriod: z.string().default("month").optional(),
    providerTrialDaysCount: z.number().default(0).optional(),
});

export const createWorkspaceSchema = workspaceSchema.omit({ id: true, workspaceId: true });
export const updateWorkspaceSchema = workspaceSchema.partial();

export const roleSchema = z.object({
    id: z.number().optional(),
    name: z.string().min(2),
    slug: z.string().min(2),
    permissions: z.record(z.any()),
    forWorkspaceType: workspaceTypeSchema,
});

export const membershipSchema = z.object({
    accountId: z.number(),
    workspaceId: z.number(),
    workspaceRoleId: z.number(),
    isActive: z.boolean().default(true),
});
