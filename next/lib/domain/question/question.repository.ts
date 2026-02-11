
import { eq, count, and } from "drizzle-orm";
import { providerQuestions } from "@/lib/database/schema";
import { BaseRepository } from "../base/base.repository";
import { type DbClient } from "@/lib/database";

/**
 * QuestionRepository - Database operations for Question entities
 */
export class QuestionRepository extends BaseRepository {

    async findById(id: string, tx?: DbClient) {
        const client = tx ?? this.db;
        const result = await client.select().from(providerQuestions).where(eq(providerQuestions.id, id)).limit(1);
        return result[0] || null;
    }

    async list(params: {
        limit: number; offset: number; providerSubjectId?: string; complexity?: string;
        gradeLevel?: number; authorAccountId?: string; onlyPublished?: boolean; workspaceId?: string;
    }, tx?: DbClient) {
        const client = tx ?? this.db;
        const filters = [];
        if (params.providerSubjectId) filters.push(eq(providerQuestions.providerSubjectId, params.providerSubjectId));
        if (params.complexity) filters.push(eq(providerQuestions.complexity, params.complexity));
        if (params.gradeLevel) filters.push(eq(providerQuestions.gradeLevel, params.gradeLevel));
        if (params.authorAccountId) filters.push(eq(providerQuestions.authorAccountId, params.authorAccountId));
        if (params.workspaceId) filters.push(eq(providerQuestions.workspaceId, params.workspaceId));
        if (params.onlyPublished) filters.push(eq(providerQuestions.isPublished, true));
        return await client.select().from(providerQuestions).where(filters.length > 0 ? and(...filters) : undefined).limit(params.limit).offset(params.offset);
    }

    async count(params: {
        providerSubjectId?: string; complexity?: string; gradeLevel?: number;
        authorAccountId?: string; onlyPublished?: boolean; workspaceId?: string;
    }, tx?: DbClient) {
        const client = tx ?? this.db;
        const filters = [];
        if (params.providerSubjectId) filters.push(eq(providerQuestions.providerSubjectId, params.providerSubjectId));
        if (params.complexity) filters.push(eq(providerQuestions.complexity, params.complexity));
        if (params.gradeLevel) filters.push(eq(providerQuestions.gradeLevel, params.gradeLevel));
        if (params.authorAccountId) filters.push(eq(providerQuestions.authorAccountId, params.authorAccountId));
        if (params.workspaceId) filters.push(eq(providerQuestions.workspaceId, params.workspaceId));
        if (params.onlyPublished) filters.push(eq(providerQuestions.isPublished, true));
        const result = await client.select({ count: count() }).from(providerQuestions).where(filters.length > 0 ? and(...filters) : undefined);
        return result[0].count;
    }

    async create(data: typeof providerQuestions.$inferInsert, tx?: DbClient) {
        const client = tx ?? this.db;
        const result = await client.insert(providerQuestions).values(data).returning();
        return result[0];
    }

    async update(id: string, data: Partial<typeof providerQuestions.$inferInsert>, tx?: DbClient) {
        const client = tx ?? this.db;
        const result = await client.update(providerQuestions).set(data).where(eq(providerQuestions.id, id)).returning();
        return result[0];
    }

    async delete(id: string, tx?: DbClient) {
        const client = tx ?? this.db;
        const result = await client.delete(providerQuestions).where(eq(providerQuestions.id, id)).returning();
        return result[0];
    }
}
