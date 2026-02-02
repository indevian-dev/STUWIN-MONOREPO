
import { z } from "zod";

/**
 * Zod schemas for Workspace module
 */

export const workspaceTypeSchema = z.enum(['student', 'provider', 'admin', 'staff', 'parent']);

export const workspaceSchema = z.object({
    id: z.string().optional(),
    title: z.string().min(2).max(255),
    type: workspaceTypeSchema,
    workspaceId: z.string().optional(),
    isActive: z.boolean().default(true),
    studentSubscribedUntill: z.string().datetime().nullable().optional(),
    providerSubscriptionPrice: z.number().nullable().optional(),
    providerProgramDescription: z.string().nullable().optional(),
    providerSubscriptionPeriod: z.enum(['month', 'year']).default("month").optional(),
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

export const createWorkspaceSchema = workspaceSchema.omit({ id: true, workspaceId: true });
export const updateWorkspaceSchema = workspaceSchema.partial();

export const roleSchema = z.object({
    id: z.string().optional(),
    name: z.string().min(2),
    permissions: z.record(z.any()),
    forWorkspaceType: workspaceTypeSchema,
});

export const membershipSchema = z.object({
    id: z.string().optional(),
    accountId: z.string(),
    workspaceId: z.string(),
    workspaceRoleId: z.string(),
    isActive: z.boolean().default(true),
});
