
import { eq, count, and } from "drizzle-orm";
import { learningSubjects, learningSubjectTopics, questions, learningSubjectPdfs } from "@/lib/app-infrastructure/database/schema";
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
        const prefixedId = id.includes(":") ? id : `learning_subjects:${id}`;
        const plainId = id.includes(":") ? id.split(":")[1] : id;

        const result = await client
            .select()
            .from(learningSubjects)
            .where(
                require("drizzle-orm").or(
                    eq(learningSubjects.id, plainId),
                    eq(learningSubjects.id, prefixedId)
                )
            )
            .limit(1);
        return result[0] || null;
    }

    async findSubjectBySlug(slug: string, tx?: DbClient) {
        const client = tx ?? this.db;
        const result = await client
            .select()
            .from(learningSubjects)
            .where(eq(learningSubjects.slug, slug))
            .limit(1);
        return result[0] || null;
    }

    async listSubjects(params: { onlyActive?: boolean, workspaceId?: string } = {}, tx?: DbClient) {
        const client = tx ?? this.db;

        const filters = [];
        if (params.onlyActive) filters.push(eq(learningSubjects.isActive, true));
        if (params.workspaceId) filters.push(eq(learningSubjects.workspaceId, params.workspaceId));

        const query = client.select().from(learningSubjects)
            .where(filters.length > 0 ? and(...filters) : undefined);
        return await query;
    }

    async createSubject(data: typeof learningSubjects.$inferInsert, tx?: DbClient) {
        const client = tx ?? this.db;
        const result = await client.insert(learningSubjects).values(data).returning();
        return result[0];
    }

    async updateSubject(id: string, data: Partial<typeof learningSubjects.$inferInsert>, tx?: DbClient) {
        const client = tx ?? this.db;
        const prefixedId = id.includes(":") ? id : `learning_subjects:${id}`;
        const plainId = id.includes(":") ? id.split(":")[1] : id;

        const result = await client
            .update(learningSubjects)
            .set(data)
            .where(
                require("drizzle-orm").or(
                    eq(learningSubjects.id, plainId),
                    eq(learningSubjects.id, prefixedId)
                )
            )
            .returning();
        return result[0];
    }

    async deleteSubject(id: string, tx?: DbClient) {
        const client = tx ?? this.db;
        const prefixedId = id.includes(":") ? id : `learning_subjects:${id}`;
        const plainId = id.includes(":") ? id.split(":")[1] : id;

        const result = await client
            .delete(learningSubjects)
            .where(
                require("drizzle-orm").or(
                    eq(learningSubjects.id, plainId),
                    eq(learningSubjects.id, prefixedId)
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
        const prefixedId = subjectId.includes(":") ? subjectId : `learning_subjects:${subjectId}`;
        const plainId = subjectId.includes(":") ? subjectId.split(":")[1] : subjectId;

        return await client
            .select()
            .from(learningSubjectTopics)
            .where(
                require("drizzle-orm").or(
                    eq(learningSubjectTopics.learningSubjectId, plainId),
                    eq(learningSubjectTopics.learningSubjectId, prefixedId)
                )
            );
    }

    async createTopic(data: typeof learningSubjectTopics.$inferInsert, tx?: DbClient) {
        const client = tx ?? this.db;
        const result = await client.insert(learningSubjectTopics).values(data).returning();
        return result[0];
    }

    async findTopicById(id: string, tx?: DbClient) {
        const client = tx ?? this.db;
        const result = await client
            .select()
            .from(learningSubjectTopics)
            .where(eq(learningSubjectTopics.id, id))
            .limit(1);
        return result[0] || null;
    }

    async bulkCreateTopics(data: (typeof learningSubjectTopics.$inferInsert)[], tx?: DbClient) {
        const client = tx ?? this.db;
        return await client.insert(learningSubjectTopics).values(data).returning();
    }

    async updateTopic(id: string, data: Partial<typeof learningSubjectTopics.$inferInsert>, tx?: DbClient) {
        const client = tx ?? this.db;
        const result = await client
            .update(learningSubjectTopics)
            .set(data)
            .where(eq(learningSubjectTopics.id, id))
            .returning();
        return result[0];
    }

    async incrementTopicQuestionStats(topicId: string, count: number, tx?: DbClient) {
        const client = tx ?? this.db;
        // Drizzle doesn't support increment easily without raw SQL or specific driver features in generic way sometimes
        // But let's check if we can use sql operator
        // Assuming we can use SQL template
        const { sql } = require("drizzle-orm");
        return await client
            .update(learningSubjectTopics)
            .set({
                topicGeneralQuestionsStats: sql`${learningSubjectTopics.topicGeneralQuestionsStats} + ${count}`
            })
            .where(eq(learningSubjectTopics.id, topicId));
    }

    // ═══════════════════════════════════════════════════════════════
    // QUESTIONS
    // ═══════════════════════════════════════════════════════════════

    async findQuestionById(id: string, tx?: DbClient) {
        const client = tx ?? this.db;
        const result = await client.select().from(questions).where(eq(questions.id, id)).limit(1);
        return result[0] || null;
    }

    async listQuestions(params: {
        limit: number;
        offset: number;
        learningSubjectId?: string;
        complexity?: string;
        gradeLevel?: number;
        authorAccountId?: string;
        onlyPublished?: boolean;
        workspaceId?: string;
    }, tx?: DbClient) {
        const client = tx ?? this.db;

        const filters = [];
        if (params.learningSubjectId) filters.push(eq(questions.learningSubjectId, params.learningSubjectId));
        if (params.complexity) filters.push(eq(questions.complexity, params.complexity));
        if (params.gradeLevel) filters.push(eq(questions.gradeLevel, params.gradeLevel));
        if (params.authorAccountId) filters.push(eq(questions.authorAccountId, params.authorAccountId));
        if (params.workspaceId) filters.push(eq(questions.workspaceId, params.workspaceId));
        if (params.onlyPublished) filters.push(eq(questions.isPublished, true));

        const query = client.select().from(questions)
            .where(filters.length > 0 ? and(...filters) : undefined)
            .limit(params.limit)
            .offset(params.offset);
        return await query;
    }

    async countQuestions(params: {
        learningSubjectId?: string;
        complexity?: string;
        gradeLevel?: number;
        authorAccountId?: string;
        onlyPublished?: boolean;
        workspaceId?: string;
    }, tx?: DbClient) {
        const client = tx ?? this.db;

        const filters = [];
        if (params.learningSubjectId) filters.push(eq(questions.learningSubjectId, params.learningSubjectId));
        if (params.complexity) filters.push(eq(questions.complexity, params.complexity));
        if (params.gradeLevel) filters.push(eq(questions.gradeLevel, params.gradeLevel));
        if (params.authorAccountId) filters.push(eq(questions.authorAccountId, params.authorAccountId));
        if (params.workspaceId) filters.push(eq(questions.workspaceId, params.workspaceId));
        if (params.onlyPublished) filters.push(eq(questions.isPublished, true));

        const result = await client.select({ count: count() }).from(questions)
            .where(filters.length > 0 ? and(...filters) : undefined);
        return result[0].count;
    }

    async createQuestion(data: typeof questions.$inferInsert, tx?: DbClient) {
        const client = tx ?? this.db;
        const result = await client.insert(questions).values(data).returning();
        return result[0];
    }

    async updateQuestion(id: string, data: Partial<typeof questions.$inferInsert>, tx?: DbClient) {
        const client = tx ?? this.db;
        const result = await client.update(questions).set(data).where(eq(questions.id, id)).returning();
        return result[0];
    }

    async deleteQuestion(id: string, tx?: DbClient) {
        const client = tx ?? this.db;
        const result = await client.delete(questions).where(eq(questions.id, id)).returning();
        return result[0];
    }

    // ═══════════════════════════════════════════════════════════════
    // PDFS & ORDERING
    // ═══════════════════════════════════════════════════════════════

    async listPdfsBySubject(subjectId: string, tx?: DbClient) {
        const client = tx ?? this.db;
        const prefixedId = subjectId.includes(":") ? subjectId : `learning_subjects:${subjectId}`;
        const plainId = subjectId.includes(":") ? subjectId.split(":")[1] : subjectId;

        return await client
            .select()
            .from(learningSubjectPdfs)
            .where(
                require("drizzle-orm").or(
                    eq(learningSubjectPdfs.learningSubjectId, plainId),
                    eq(learningSubjectPdfs.learningSubjectId, prefixedId)
                )
            );
    }

    async getPdfById(id: string, tx?: DbClient) {
        const client = tx ?? this.db;
        const result = await client.select().from(learningSubjectPdfs).where(eq(learningSubjectPdfs.id, id)).limit(1);
        return result[0] || null;
    }

    async updatePdfOrder(id: string, orderedIds: string[], tx?: DbClient) {
        const client = tx ?? this.db;
        return await client.update(learningSubjectPdfs).set({ topicsOrderedIds: orderedIds }).where(eq(learningSubjectPdfs.id, id)).returning();
    }

    async createSubjectPdf(data: typeof learningSubjectPdfs.$inferInsert, tx?: DbClient) {
        const client = tx ?? this.db;
        const result = await client.insert(learningSubjectPdfs).values(data).returning();
        return result[0];
    }
}
