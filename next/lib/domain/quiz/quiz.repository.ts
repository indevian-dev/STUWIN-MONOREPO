
import { eq, desc, and, sql } from "drizzle-orm";
import { studentQuizzes, studentQuizReports, studentTopicMastery } from "@/lib/database/schema";
import { BaseRepository } from "../base/base.repository";
import { type DbClient } from "@/lib/database";

/**
 * QuizRepository - Database operations for quizzes, reports, and mastery tracking
 */
export class QuizRepository extends BaseRepository {
    // ═══════════════════════════════════════════════════════════════
    // QUIZZES
    // ═══════════════════════════════════════════════════════════════

    async findById(id: string, tx?: DbClient) {
        const client = tx ?? this.db;
        const result = await client.select().from(studentQuizzes).where(eq(studentQuizzes.id, id)).limit(1);
        return result[0] || null;
    }

    async listByAccount(accountId: string, tx?: DbClient) {
        const client = tx ?? this.db;
        return await client
            .select()
            .from(studentQuizzes)
            .where(eq(studentQuizzes.studentAccountId, accountId))
            .orderBy(desc(studentQuizzes.createdAt));
    }

    async list(params: { accountId: string; status?: string; providerSubjectId?: string; workspaceId?: string; limit: number; offset: number }, tx?: DbClient) {
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

    async count(params: { accountId: string; status?: string; providerSubjectId?: string; workspaceId?: string }, tx?: DbClient) {
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

    async create(data: typeof studentQuizzes.$inferInsert, tx?: DbClient) {
        const client = tx ?? this.db;
        const result = await client.insert(studentQuizzes).values(data).returning();
        return result[0];
    }

    async update(id: string, data: Partial<typeof studentQuizzes.$inferInsert>, tx?: DbClient) {
        const client = tx ?? this.db;
        const result = await client.update(studentQuizzes).set(data).where(eq(studentQuizzes.id, id)).returning();
        return result[0];
    }

    async delete(id: string, accountId: string, tx?: DbClient) {
        const client = tx ?? this.db;
        const result = await client.delete(studentQuizzes)
            .where(and(eq(studentQuizzes.id, id), eq(studentQuizzes.studentAccountId, accountId)))
            .returning();
        return result.length > 0;
    }

    // ═══════════════════════════════════════════════════════════════
    // QUIZ REPORTS
    // ═══════════════════════════════════════════════════════════════

    async findReportByQuizId(quizId: string, tx?: DbClient) {
        const client = tx ?? this.db;
        const result = await client
            .select()
            .from(studentQuizReports as any)
            .where(eq((studentQuizReports as any).quizId, quizId))
            .limit(1);
        return result[0] || null;
    }

    async createReport(data: any, tx?: DbClient) {
        const client = tx ?? this.db;
        const result = await client.insert(studentQuizReports as any).values(data).returning();
        return result[0];
    }

    // ═══════════════════════════════════════════════════════════════
    // STUDENT TOPIC MASTERY
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
