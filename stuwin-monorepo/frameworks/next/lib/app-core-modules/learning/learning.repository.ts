
import { eq, count, and, or, sql } from "drizzle-orm";
import { providerSubjects, providerSubjectTopics, providerQuestions, providerSubjectPdfs } from "@/lib/app-infrastructure/database/schema";
import { BaseRepository } from "../domain/BaseRepository";
import { type DbClient } from "@/lib/app-infrastructure/database";

/**
 * LearningRepository - Handles database operations for learning entities (Subjects, Topics, Questions)
 */
export class LearningRepository extends BaseRepository {
    // ═══════════════════════════════════════════════════════════════
    // SUBJECTS
    // ═══════════════════════════════════════════════════════════════

    async findSubjectById(id: string, tx?: DbClient) {
        const client = tx ?? this.db;
        const prefixedId = id.includes(":") ? id : `provider_subjects:${id}`;
        const plainId = id.includes(":") ? id.split(":")[1] : id;

        const result = await client
            .select()
            .from(providerSubjects)
            .where(
                or(
                    eq(providerSubjects.id, plainId),
                    eq(providerSubjects.id, prefixedId)
                )
            )
            .limit(1);
        return result[0] || null;
    }

    async findSubjectBySlug(slug: string, tx?: DbClient) {
        const client = tx ?? this.db;
        const result = await client
            .select()
            .from(providerSubjects)
            .where(eq(providerSubjects.slug, slug))
            .limit(1);
        return result[0] || null;
    }

    async listSubjects(params: { onlyActive?: boolean, workspaceId?: string } = {}, tx?: DbClient) {
        const client = tx ?? this.db;

        const filters = [];
        if (params.onlyActive) filters.push(eq(providerSubjects.isActive, true));
        if (params.workspaceId) filters.push(eq(providerSubjects.workspaceId, params.workspaceId));

        const query = client.select().from(providerSubjects)
            .where(filters.length > 0 ? and(...filters) : undefined);
        return await query;
    }

    async createSubject(data: typeof providerSubjects.$inferInsert, tx?: DbClient) {
        const client = tx ?? this.db;
        const result = await client.insert(providerSubjects).values(data).returning();
        return result[0];
    }

    async updateSubject(id: string, data: Partial<typeof providerSubjects.$inferInsert>, tx?: DbClient) {
        const client = tx ?? this.db;
        const prefixedId = id.includes(":") ? id : `provider_subjects:${id}`;
        const plainId = id.includes(":") ? id.split(":")[1] : id;

        const result = await client
            .update(providerSubjects)
            .set(data)
            .where(
                or(
                    eq(providerSubjects.id, plainId),
                    eq(providerSubjects.id, prefixedId)
                )
            )
            .returning();
        return result[0];
    }

    async deleteSubject(id: string, tx?: DbClient) {
        const client = tx ?? this.db;
        const prefixedId = id.includes(":") ? id : `provider_subjects:${id}`;
        const plainId = id.includes(":") ? id.split(":")[1] : id;

        const result = await client
            .delete(providerSubjects)
            .where(
                or(
                    eq(providerSubjects.id, plainId),
                    eq(providerSubjects.id, prefixedId)
                )
            )
            .returning();
        return result[0];
    }

    // ═══════════════════════════════════════════════════════════════
    // TOPICS
    // ═══════════════════════════════════════════════════════════════

    async listTopicsBySubject(subjectId: string, tx?: DbClient) {
        const client = tx ?? this.db;
        const prefixedId = subjectId.includes(":") ? subjectId : `provider_subjects:${subjectId}`;
        const plainId = subjectId.includes(":") ? subjectId.split(":")[1] : subjectId;

        return await client
            .select()
            .from(providerSubjectTopics)
            .where(
                or(
                    eq(providerSubjectTopics.providerSubjectId, plainId),
                    eq(providerSubjectTopics.providerSubjectId, prefixedId)
                )
            );
    }

    async createTopic(data: typeof providerSubjectTopics.$inferInsert, tx?: DbClient) {
        const client = tx ?? this.db;
        const result = await client.insert(providerSubjectTopics).values(data).returning();
        return result[0];
    }

    async findTopicById(id: string, tx?: DbClient) {
        const client = tx ?? this.db;
        const result = await client
            .select()
            .from(providerSubjectTopics)
            .where(eq(providerSubjectTopics.id, id))
            .limit(1);
        return result[0] || null;
    }

    async bulkCreateTopics(data: (typeof providerSubjectTopics.$inferInsert)[], tx?: DbClient) {
        const client = tx ?? this.db;
        return await client.insert(providerSubjectTopics).values(data).returning();
    }

    async updateTopic(id: string, data: Partial<typeof providerSubjectTopics.$inferInsert>, tx?: DbClient) {
        const client = tx ?? this.db;
        const result = await client
            .update(providerSubjectTopics)
            .set(data)
            .where(eq(providerSubjectTopics.id, id))
            .returning();
        return result[0];
    }

    async incrementTopicQuestionStats(topicId: string, count: number, tx?: DbClient) {
        const client = tx ?? this.db;
        return await client
            .update(providerSubjectTopics)
            .set({
                topicGeneralQuestionsStats: sql`${providerSubjectTopics.topicGeneralQuestionsStats} + ${count}`
            })
            .where(eq(providerSubjectTopics.id, topicId));
    }

    // ═══════════════════════════════════════════════════════════════
    // QUESTIONS
    // ═══════════════════════════════════════════════════════════════

    async findQuestionById(id: string, tx?: DbClient) {
        const client = tx ?? this.db;
        const result = await client.select().from(providerQuestions).where(eq(providerQuestions.id, id)).limit(1);
        return result[0] || null;
    }

    async listQuestions(params: {
        limit: number;
        offset: number;
        providerSubjectId?: string;
        complexity?: string;
        gradeLevel?: number;
        authorAccountId?: string;
        onlyPublished?: boolean;
        workspaceId?: string;
    }, tx?: DbClient) {
        const client = tx ?? this.db;

        const filters = [];
        if (params.providerSubjectId) filters.push(eq(providerQuestions.providerSubjectId, params.providerSubjectId));
        if (params.complexity) filters.push(eq(providerQuestions.complexity, params.complexity));
        if (params.gradeLevel) filters.push(eq(providerQuestions.gradeLevel, params.gradeLevel));
        if (params.authorAccountId) filters.push(eq(providerQuestions.authorAccountId, params.authorAccountId));
        if (params.workspaceId) filters.push(eq(providerQuestions.workspaceId, params.workspaceId));
        if (params.onlyPublished) filters.push(eq(providerQuestions.isPublished, true));

        const query = client.select().from(providerQuestions)
            .where(filters.length > 0 ? and(...filters) : undefined)
            .limit(params.limit)
            .offset(params.offset);
        return await query;
    }

    async countQuestions(params: {
        providerSubjectId?: string;
        complexity?: string;
        gradeLevel?: number;
        authorAccountId?: string;
        onlyPublished?: boolean;
        workspaceId?: string;
    }, tx?: DbClient) {
        const client = tx ?? this.db;

        const filters = [];
        if (params.providerSubjectId) filters.push(eq(providerQuestions.providerSubjectId, params.providerSubjectId));
        if (params.complexity) filters.push(eq(providerQuestions.complexity, params.complexity));
        if (params.gradeLevel) filters.push(eq(providerQuestions.gradeLevel, params.gradeLevel));
        if (params.authorAccountId) filters.push(eq(providerQuestions.authorAccountId, params.authorAccountId));
        if (params.workspaceId) filters.push(eq(providerQuestions.workspaceId, params.workspaceId));
        if (params.onlyPublished) filters.push(eq(providerQuestions.isPublished, true));

        const result = await client.select({ count: count() }).from(providerQuestions)
            .where(filters.length > 0 ? and(...filters) : undefined);
        return result[0].count;
    }

    async createQuestion(data: typeof providerQuestions.$inferInsert, tx?: DbClient) {
        const client = tx ?? this.db;
        const result = await client.insert(providerQuestions).values(data).returning();
        return result[0];
    }

    async updateQuestion(id: string, data: Partial<typeof providerQuestions.$inferInsert>, tx?: DbClient) {
        const client = tx ?? this.db;
        const result = await client.update(providerQuestions).set(data).where(eq(providerQuestions.id, id)).returning();
        return result[0];
    }

    async deleteQuestion(id: string, tx?: DbClient) {
        const client = tx ?? this.db;
        const result = await client.delete(providerQuestions).where(eq(providerQuestions.id, id)).returning();
        return result[0];
    }

    // ═══════════════════════════════════════════════════════════════
    // PDFS & ORDERING
    // ═══════════════════════════════════════════════════════════════

    async listPdfsBySubject(subjectId: string, tx?: DbClient) {
        const client = tx ?? this.db;
        const prefixedId = subjectId.includes(":") ? subjectId : `provider_subjects:${subjectId}`;
        const plainId = subjectId.includes(":") ? subjectId.split(":")[1] : subjectId;

        return await client
            .select()
            .from(providerSubjectPdfs)
            .where(
                or(
                    eq(providerSubjectPdfs.providerSubjectId, plainId),
                    eq(providerSubjectPdfs.providerSubjectId, prefixedId)
                )
            );
    }

    async getPdfById(id: string, tx?: DbClient) {
        const client = tx ?? this.db;
        const result = await client.select().from(providerSubjectPdfs).where(eq(providerSubjectPdfs.id, id)).limit(1);
        return result[0] || null;
    }

    async updatePdfOrder(id: string, orderedIds: string[], tx?: DbClient) {
        const client = tx ?? this.db;
        return await client.update(providerSubjectPdfs).set({ topicsOrderedIds: orderedIds }).where(eq(providerSubjectPdfs.id, id)).returning();
    }

    async createSubjectPdf(data: typeof providerSubjectPdfs.$inferInsert, tx?: DbClient) {
        const client = tx ?? this.db;
        const result = await client.insert(providerSubjectPdfs).values(data).returning();
        return result[0];
    }
    async deleteTopic(id: string, tx?: DbClient) {
        const client = tx ?? this.db;
        const result = await client
            .delete(providerSubjectTopics)
            .where(eq(providerSubjectTopics.id, id))
            .returning();
        return result[0];
    }
}
