
import { eq, desc, and } from "drizzle-orm";
import { studentAiSessions } from "@/lib/database/schema";
import { BaseRepository } from "../base/Base.repository";
import { type DbClient } from "@/lib/database";

/**
 * AiSessionRepository - Database operations for AI learning sessions
 */
export class AiSessionRepository extends BaseRepository {

    async findById(id: string, tx?: DbClient) {
        const client = tx ?? this.db;
        const result = await client.select().from(studentAiSessions).where(eq(studentAiSessions.id, id)).limit(1);
        return result[0] || null;
    }

    async create(data: typeof studentAiSessions.$inferInsert, tx?: DbClient) {
        const client = tx ?? this.db;
        const result = await client.insert(studentAiSessions).values(data).returning();
        return result[0];
    }

    async update(id: string, data: Partial<typeof studentAiSessions.$inferInsert>, tx?: DbClient) {
        const client = tx ?? this.db;
        const result = await client
            .update(studentAiSessions)
            .set({ ...data, updatedAt: new Date() })
            .where(eq(studentAiSessions.id, id))
            .returning();
        return result[0];
    }

    async findActive(accountId: string, contextId: string, contextType: 'quiz' | 'homework' | 'topic', tx?: DbClient) {
        const client = tx ?? this.db;

        const conditions = [
            eq(studentAiSessions.studentAccountId, accountId),
            eq(studentAiSessions.status, 'active')
        ];

        if (contextType === 'quiz') conditions.push(eq(studentAiSessions.quizId, contextId));
        else if (contextType === 'homework') conditions.push(eq(studentAiSessions.homeworkId, contextId));
        else if (contextType === 'topic') conditions.push(eq(studentAiSessions.topicId, contextId));

        const result = await client
            .select()
            .from(studentAiSessions)
            .where(and(...conditions))
            .limit(1);

        return result[0] || null;
    }

    async listByAccount(accountId: string, status: string = 'active', tx?: DbClient) {
        const client = tx ?? this.db;
        return await client
            .select()
            .from(studentAiSessions)
            .where(and(
                eq(studentAiSessions.studentAccountId, accountId),
                eq(studentAiSessions.status, status)
            ))
            .orderBy(desc(studentAiSessions.createdAt));
    }
}
