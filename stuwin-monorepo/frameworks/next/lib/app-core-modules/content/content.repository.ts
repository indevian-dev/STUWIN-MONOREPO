
import { eq, desc, and, ilike, or, count } from "drizzle-orm";
import { blogs, pages, systemPrompts } from "@/lib/app-infrastructure/database/schema";
import { BaseRepository } from "../domain/BaseRepository";
import { type DbClient } from "@/lib/app-infrastructure/database";

/**
 * ContentRepository - Handles CMS data (blogs, pages, prompts)
 */
export class ContentRepository extends BaseRepository {
    // ═══════════════════════════════════════════════════════════════
    // BLOGS
    // ═══════════════════════════════════════════════════════════════

    async findBlogById(id: string, tx?: DbClient) {
        const client = tx ?? this.db;
        const result = await client.select().from(blogs).where(eq(blogs.id, id)).limit(1);
        return result[0] || null;
    }

    async findBlogBySlug(slug: string, tx?: DbClient) {
        const client = tx ?? this.db;
        const result = await client.select().from(blogs).where(eq(blogs.slug, slug)).limit(1);
        return result[0] || null;
    }

    async listBlogs(params: {
        onlyActive?: boolean;
        limit?: number;
        offset?: number;
        search?: string;
    }, tx?: DbClient) {
        const client = tx ?? this.db;
        const { onlyActive = true, limit = 10, offset = 0, search } = params;

        let whereClause = onlyActive ? eq(blogs.isActive, true) : undefined;
        if (search) {
            const searchFilter = or(
                ilike(blogs.titleAz, `%${search}%`),
                ilike(blogs.titleEn, `%${search}%`),
                ilike(blogs.contentAz, `%${search}%`),
                ilike(blogs.contentEn, `%${search}%`)
            );
            whereClause = whereClause ? and(whereClause, searchFilter) : searchFilter;
        }

        const data = await client
            .select()
            .from(blogs)
            .where(whereClause)
            .limit(limit)
            .offset(offset)
            .orderBy(desc(blogs.createdAt));

        const countResult = await client
            .select({ val: count() })
            .from(blogs)
            .where(whereClause);

        return { data, total: countResult[0].val };
    }

    async createBlog(data: typeof blogs.$inferInsert, tx?: DbClient) {
        const client = tx ?? this.db;
        const result = await client.insert(blogs).values(data).returning();
        return result[0];
    }

    async updateBlog(id: string, data: Partial<typeof blogs.$inferInsert>, tx?: DbClient) {
        const client = tx ?? this.db;
        const result = await client
            .update(blogs)
            .set({ ...data, updatedAt: new Date() })
            .where(eq(blogs.id, id))
            .returning();
        return result[0];
    }

    async deleteBlog(id: string, tx?: DbClient) {
        const client = tx ?? this.db;
        const result = await client.delete(blogs).where(eq(blogs.id, id)).returning();
        return result[0];
    }

    // ═══════════════════════════════════════════════════════════════
    // PAGES
    // ═══════════════════════════════════════════════════════════════

    async findPageByType(type: string, tx?: DbClient) {
        const client = tx ?? this.db;
        const result = await client.select().from(pages).where(eq(pages.type, type)).limit(1);
        return result[0] || null;
    }

    // ═══════════════════════════════════════════════════════════════
    // SYSTEM PROMPTS
    // ═══════════════════════════════════════════════════════════════

    async findPromptById(id: string, tx?: DbClient) {
        const client = tx ?? this.db;
        const result = await client.select().from(systemPrompts).where(eq(systemPrompts.id, id)).limit(1);
        return result[0] || null;
    }

    async listPrompts(tx?: DbClient) {
        const client = tx ?? this.db;
        return await client.select().from(systemPrompts);
    }

    async listPromptsPaginated(options: { limit: number; offset: number; search?: string }, tx?: DbClient) {
        const client = tx ?? this.db;
        let whereClause = undefined;
        if (options.search) {
            whereClause = or(
                ilike(systemPrompts.title, `%${options.search}%`),
                ilike(systemPrompts.body, `%${options.search}%`)
            );
        }

        return await client
            .select()
            .from(systemPrompts)
            .where(whereClause)
            .orderBy(desc(systemPrompts.createdAt))
            .limit(options.limit)
            .offset(options.offset);
    }

    async countPrompts(options: { search?: string }, tx?: DbClient) {
        const client = tx ?? this.db;
        let whereClause = undefined;
        if (options.search) {
            whereClause = or(
                ilike(systemPrompts.title, `%${options.search}%`),
                ilike(systemPrompts.body, `%${options.search}%`)
            );
        }

        const result = await client
            .select({ val: count() })
            .from(systemPrompts)
            .where(whereClause);
        return Number(result[0]?.val || 0);
    }

    async createPrompt(data: typeof systemPrompts.$inferInsert, tx?: DbClient) {
        const client = tx ?? this.db;
        const result = await client.insert(systemPrompts).values(data).returning();
        return result[0];
    }

    async updatePrompt(id: string, data: Partial<typeof systemPrompts.$inferInsert>, tx?: DbClient) {
        const client = tx ?? this.db;
        const result = await client
            .update(systemPrompts)
            .set(data)
            .where(eq(systemPrompts.id, id))
            .returning();
        return result[0];
    }

    async deletePrompt(id: string, tx?: DbClient) {
        const client = tx ?? this.db;
        const result = await client.delete(systemPrompts).where(eq(systemPrompts.id, id)).returning();
        return result[0];
    }

    // ═══════════════════════════════════════════════════════════════
    // PAGES (Continued)
    // ═══════════════════════════════════════════════════════════════

    async findPageById(id: string, tx?: DbClient) {
        const client = tx ?? this.db;
        const result = await client.select().from(pages).where(eq(pages.id, id)).limit(1);
        return result[0] || null;
    }

    async updatePage(id: string, data: Partial<typeof pages.$inferInsert>, tx?: DbClient) {
        const client = tx ?? this.db;
        return await client
            .update(pages)
            .set({ ...data, updateAt: new Date() })
            .where(eq(pages.id, id))
            .returning();
    }
}
