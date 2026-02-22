
import { z } from "zod";
import type { Blog } from "./Content.types";

// ═══════════════════════════════════════════════════════════════
// CONTENT INPUT SCHEMAS
// ═══════════════════════════════════════════════════════════════

// ─── BLOG ──────────────────────────────────────────────────────

export const BlogCreateSchema = z.object({
    titleAz: z.string().min(2).max(255).optional(),
    titleEn: z.string().min(2).max(255).optional(),
    contentAz: z.string().optional(),
    contentEn: z.string().optional(),
    slug: z.string().min(2).max(255),
    isActive: z.boolean().default(true).optional(),
    isFeatured: z.boolean().default(false).optional(),
    cover: z.string().url().optional().or(z.literal('')),
}) satisfies z.ZodType<Blog.CreateInput>;

export type BlogCreateInput = z.infer<typeof BlogCreateSchema>;

export const BlogUpdateSchema = BlogCreateSchema.partial();
export type BlogUpdateInput = z.infer<typeof BlogUpdateSchema>;

// ─── PAGE ──────────────────────────────────────────────────────

export const PageCreateSchema = z.object({
    type: z.string().min(2),
    titleAz: z.string().optional(),
    titleEn: z.string().optional(),
    contentAz: z.string().optional(),
    contentEn: z.string().optional(),
    isActive: z.boolean().default(true),
});

export type PageCreateInput = z.infer<typeof PageCreateSchema>;

// ─── PROMPT ────────────────────────────────────────────────────

export const PromptCreateSchema = z.object({
    name: z.string().min(2),
    prompt: z.string().min(10),
    version: z.number().int().default(1),
    description: z.string().optional(),
});

export type PromptCreateInput = z.infer<typeof PromptCreateSchema>;
