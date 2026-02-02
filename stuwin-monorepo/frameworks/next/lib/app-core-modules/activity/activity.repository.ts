
import { eq, desc, and, sql } from "drizzle-orm";
import { studentQuizzes, studentHomeworks, studentAiSessions, studentQuizReports, studentTopicMastery } from "@/lib/app-infrastructure/database/schema";
import { BaseRepository } from "../domain/BaseRepository";
import { type DbClient } from "@/lib/app-infrastructure/database";

/**
 * ActivityRepository - Handles assessment and session data (Quizzes, Homeworks, Sessions)
 */
export class ActivityRepository extends BaseRepository {
    // ═══════════════════════════════════════════════════════════════
    // QUIZZES
    // ═══════════════════════════════════════════════════════════════

    async findQuizById(id: string, tx?: DbClient) {
        const client = tx ?? this.db;
        const result = await client.select().from(studentQuizzes).where(eq(studentQuizzes.id, id)).limit(1);
        return result[0] || null;
    }

    async listQuizzesByAccount(accountId: string, tx?: DbClient) {
        const client = tx ?? this.db;
        return await client
            .select()
            .from(studentQuizzes)
            .where(eq(studentQuizzes.studentAccountId, accountId))
            .orderBy(desc(studentQuizzes.createdAt));
    }

    async listQuizzes(params: { accountId: string; status?: string; providerSubjectId?: string; workspaceId?: string; limit: number; offset: number }, tx?: DbClient) {
        const client = tx ?? this.db;
        const conditions = [eq(studentQuizzes.studentAccountId, params.accountId)];
        if (params.status) conditions.push(eq(studentQuizzes.status, params.status));
        if (params.providerSubjectId) conditions.push(eq(studentQuizzes.providerSubjectId, params.providerSubjectId));
        if (params.workspaceId) conditions.push(eq(studentQuizzes.workspaceId, params.workspaceId));

        return await client
            .select()
            .from(studentQuizzes)
            .where(and(...conditions))
            .orderBy(desc(studentQuizzes.createdAt))
            .limit(params.limit)
            .offset(params.offset);
    }

    async countQuizzes(params: { accountId: string; status?: string; providerSubjectId?: string; workspaceId?: string }, tx?: DbClient) {
        const client = tx ?? this.db;
        const conditions = [eq(studentQuizzes.studentAccountId, params.accountId)];
        if (params.status) conditions.push(eq(studentQuizzes.status, params.status));
        if (params.providerSubjectId) conditions.push(eq(studentQuizzes.providerSubjectId, params.providerSubjectId));
        if (params.workspaceId) conditions.push(eq(studentQuizzes.workspaceId, params.workspaceId));

        const result = await client
            .select({ count: sql<number>`count(*)` })
            .from(studentQuizzes)
            .where(and(...conditions));
        return Number(result[0]?.count || 0);
    }

    async createQuiz(data: typeof studentQuizzes.$inferInsert, tx?: DbClient) {
        const client = tx ?? this.db;
        const result = await client.insert(studentQuizzes).values(data).returning();
        return result[0];
    }

    async updateQuiz(id: string, data: Partial<typeof studentQuizzes.$inferInsert>, tx?: DbClient) {
        const client = tx ?? this.db;
        const result = await client.update(studentQuizzes).set(data).where(eq(studentQuizzes.id, id)).returning();
        return result[0];
    }

    async deleteQuiz(id: string, accountId: string, tx?: DbClient) {
        const client = tx ?? this.db;
        const result = await client.delete(studentQuizzes)
            .where(and(eq(studentQuizzes.id, id), eq(studentQuizzes.studentAccountId, accountId)))
            .returning();
        return result.length > 0;
    }

    // ═══════════════════════════════════════════════════════════════
    // QUIZ REPORTS
    // ═══════════════════════════════════════════════════════════════

    async findQuizReportByQuizId(quizId: string, tx?: DbClient) {
        const client = tx ?? this.db;
        const result = await client
            .select()
            .from(studentQuizReports as any)
            .where(eq((studentQuizReports as any).quizId, quizId))
            .limit(1);
        return result[0] || null;
    }

    async createQuizReport(data: any, tx?: DbClient) {
        const client = tx ?? this.db;
        const result = await client.insert(studentQuizReports as any).values(data).returning();
        return result[0];
    }

    // ═══════════════════════════════════════════════════════════════
    // HOMEWORKS
    // ═══════════════════════════════════════════════════════════════

    async findHomeworkById(id: string, tx?: DbClient) {
        const client = tx ?? this.db;
        const result = await client.select().from(studentHomeworks).where(eq(studentHomeworks.id, id)).limit(1);
        return result[0] || null;
    }

    async listHomeworksByAccount(accountId: string, tx?: DbClient) {
        const client = tx ?? this.db;
        return await client
            .select()
            .from(studentHomeworks)
            .where(eq(studentHomeworks.studentAccountId, accountId))
            .orderBy(desc(studentHomeworks.createdAt));
    }

    async createHomework(data: any, tx?: DbClient) {
        const client = tx ?? this.db;
        const result = await client.insert(studentHomeworks).values(data).returning();
        return result[0];
    }

    async updateHomework(id: string, data: any, tx?: DbClient) {
        const client = tx ?? this.db;
        const result = await client.update(studentHomeworks).set(data).where(eq(studentHomeworks.id, id)).returning();
        return result[0];
    }

    // ═══════════════════════════════════════════════════════════════
    // LEARNING SESSIONS
    // ═══════════════════════════════════════════════════════════════

    async findAiSessionById(id: string, tx?: DbClient) {
        const client = tx ?? this.db;
        const result = await client.select().from(studentAiSessions).where(eq(studentAiSessions.id, id)).limit(1);
        return result[0] || null;
    }

    async createAiSession(data: typeof studentAiSessions.$inferInsert, tx?: DbClient) {
        const client = tx ?? this.db;
        const result = await client.insert(studentAiSessions).values(data).returning();
        return result[0];
    }

    async updateAiSession(id: string, data: Partial<typeof studentAiSessions.$inferInsert>, tx?: DbClient) {
        const client = tx ?? this.db;
        const result = await client
            .update(studentAiSessions)
            .set({ ...data, updatedAt: new Date() })
            .where(eq(studentAiSessions.id, id))
            .returning();
        return result[0];
    }

    async findActiveAiSession(accountId: string, contextId: string, contextType: 'quiz' | 'homework' | 'topic', tx?: DbClient) {
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

    // ═══════════════════════════════════════════════════════════════
    // STUDENT TOPIC MASTERY (ANALYTICS)
    // ═══════════════════════════════════════════════════════════════

    async findMastery(studentAccountId: string, topicId: string, tx?: DbClient) {
        const client = tx ?? this.db;
        const result = await client
            .select()
            .from(studentTopicMastery)
            .where(and(eq(studentTopicMastery.studentAccountId, studentAccountId), eq(studentTopicMastery.topicId, topicId)))
            .limit(1);
        return result[0] || null;
    }

    async findMasteryBySubject(studentAccountId: string, subjectId: string, tx?: DbClient) {
        const client = tx ?? this.db;
        return await client
            .select()
            .from(studentTopicMastery)
            .where(and(eq(studentTopicMastery.studentAccountId, studentAccountId), eq(studentTopicMastery.providerSubjectId, subjectId)));
    }

    async createMastery(data: typeof studentTopicMastery.$inferInsert, tx?: DbClient) {
        const client = tx ?? this.db;
        const result = await client.insert(studentTopicMastery).values(data).returning();
        return result[0];
    }

    async updateMastery(id: string, data: Partial<typeof studentTopicMastery.$inferInsert>, tx?: DbClient) {
        const client = tx ?? this.db;
        const result = await client.update(studentTopicMastery).set(data).where(eq(studentTopicMastery.id, id)).returning();
        return result[0];
    }
}
