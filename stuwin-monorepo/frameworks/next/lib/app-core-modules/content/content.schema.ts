
import { z } from "zod";

/**
 * Zod schemas for Content module (Blogs, Pages, Prompts)
 */

export const blogSchema = z.object({
    id: z.number().optional(),
    titleAz: z.string().min(2).max(255).optional(),
    titleEn: z.string().min(2).max(255).optional(),
    slug: z.string().min(2).max(255),
    contentAz: z.string().optional(),
    contentEn: z.string().optional(),
    isActive: z.boolean().default(true),
    isFeatured: z.boolean().default(false),
    cover: z.string().url().optional().or(z.literal('')),
});

export const createBlogSchema = blogSchema.omit({ id: true });
export const updateBlogSchema = blogSchema.partial();

export const pageSchema = z.object({
    id: z.number().optional(),
    type: z.string().min(2),
    titleAz: z.string().optional(),
    titleEn: z.string().optional(),
    contentAz: z.string().optional(),
    contentEn: z.string().optional(),
    isActive: z.boolean().default(true),
});

export const promptSchema = z.object({
    id: z.number().optional(),
    name: z.string().min(2),
    prompt: z.string().min(10),
    version: z.number().int().default(1),
    description: z.string().optional(),
});
