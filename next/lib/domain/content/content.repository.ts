
import { eq, desc, and, ilike, or, count, sql } from "drizzle-orm";
import { blogs, docs, systemPromptsCrib } from "@/lib/database/schema";
import { BaseRepository } from "../base/base.repository";
import { type DbClient } from "@/lib/database";

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
                sql`${blogs.localizedContent}->'az'->>'title' ILIKE ${`%${search}%`}`,
                sql`${blogs.localizedContent}->'en'->>'title' ILIKE ${`%${search}%`}`,
                sql`${blogs.localizedContent}->'az'->>'content' ILIKE ${`%${search}%`}`,
                sql`${blogs.localizedContent}->'en'->>'content' ILIKE ${`%${search}%`}`
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
        const result = await client.select().from(docs).where(eq(docs.type, type)).limit(1);
        return result[0] || null;
    }

    // ═══════════════════════════════════════════════════════════════
    // SYSTEM PROMPTS
    // ═══════════════════════════════════════════════════════════════

    async findPromptById(id: string, tx?: DbClient) {
        const client = tx ?? this.db;
        const result = await client.select().from(systemPromptsCrib).where(eq(systemPromptsCrib.id, id)).limit(1);
        return result[0] || null;
    }

    async listPrompts(tx?: DbClient) {
        const client = tx ?? this.db;
        return await client.select().from(systemPromptsCrib);
    }

    async listPromptsPaginated(options: { limit: number; offset: number; search?: string }, tx?: DbClient) {
        const client = tx ?? this.db;
        let whereClause = undefined;
        if (options.search) {
            whereClause = or(
                ilike(systemPromptsCrib.title, `%${options.search}%`),
                ilike(systemPromptsCrib.body, `%${options.search}%`)
            );
        }

        return await client
            .select()
            .from(systemPromptsCrib)
            .where(whereClause)
            .orderBy(desc(systemPromptsCrib.createdAt))
            .limit(options.limit)
            .offset(options.offset);
    }

    async countPrompts(options: { search?: string }, tx?: DbClient) {
        const client = tx ?? this.db;
        let whereClause = undefined;
        if (options.search) {
            whereClause = or(
                ilike(systemPromptsCrib.title, `%${options.search}%`),
                ilike(systemPromptsCrib.body, `%${options.search}%`)
            );
        }

        const result = await client
            .select({ val: count() })
            .from(systemPromptsCrib)
            .where(whereClause);
        return Number(result[0]?.val || 0);
    }

    async createPrompt(data: typeof systemPromptsCrib.$inferInsert, tx?: DbClient) {
        const client = tx ?? this.db;
        const result = await client.insert(systemPromptsCrib).values(data).returning();
        return result[0];
    }

    async updatePrompt(id: string, data: Partial<typeof systemPromptsCrib.$inferInsert>, tx?: DbClient) {
        const client = tx ?? this.db;
        const result = await client
            .update(systemPromptsCrib)
            .set(data)
            .where(eq(systemPromptsCrib.id, id))
            .returning();
        return result[0];
    }

    async deletePrompt(id: string, tx?: DbClient) {
        const client = tx ?? this.db;
        const result = await client.delete(systemPromptsCrib).where(eq(systemPromptsCrib.id, id)).returning();
        return result[0];
    }

    // ═══════════════════════════════════════════════════════════════
    // PAGES (Continued)
    // ═══════════════════════════════════════════════════════════════

    async findPageById(id: string, tx?: DbClient) {
        const client = tx ?? this.db;
        const result = await client.select().from(docs).where(eq(docs.id, id)).limit(1);
        return result[0] || null;
    }

    async createPage(data: typeof docs.$inferInsert, tx?: DbClient) {
        const client = tx ?? this.db;
        const result = await client.insert(docs).values(data).returning();
        return result[0];
    }

    async updatePage(id: string, data: Partial<typeof docs.$inferInsert>, tx?: DbClient) {
        const client = tx ?? this.db;
        return await client
            .update(docs)
            .set({ ...data, updatedAt: new Date() })
            .where(eq(docs.id, id))
            .returning();
    }
}
