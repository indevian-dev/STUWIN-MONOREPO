
import { eq, count, and, or, sql } from "drizzle-orm";
import { providerSubjects, providerSubjectTopics, providerQuestions } from "@/lib/database/schema";
import { BaseRepository } from "../base/Base.repository";
import { type DbClient } from "@/lib/database";

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

    async listTopicsBySubject(subjectId: string, options?: { excludeVector?: boolean }, tx?: DbClient) {
        const client = tx ?? this.db;
        const prefixedId = subjectId.includes(":") ? subjectId : `provider_subjects:${subjectId}`;
        const plainId = subjectId.includes(":") ? subjectId.split(":")[1] : subjectId;

        if (options?.excludeVector) {
            return await client
                .select({
                    id: providerSubjectTopics.id,
                    createdAt: providerSubjectTopics.createdAt,
                    description: providerSubjectTopics.description,
                    gradeLevel: providerSubjectTopics.gradeLevel,
                    name: providerSubjectTopics.name,
                    providerSubjectId: providerSubjectTopics.providerSubjectId,
                    aiSummary: providerSubjectTopics.aiSummary,
                    isActiveAiGeneration: providerSubjectTopics.isActiveAiGeneration,
                    workspaceId: providerSubjectTopics.workspaceId,
                    updatedAt: providerSubjectTopics.updatedAt,
                    language: providerSubjectTopics.language,
                    aiGuide: providerSubjectTopics.aiGuide,
                    pdfDetails: providerSubjectTopics.pdfDetails,
                    questionsStats: providerSubjectTopics.questionsStats,
                })
                .from(providerSubjectTopics)
                .where(
                    or(
                        eq(providerSubjectTopics.providerSubjectId, plainId),
                        eq(providerSubjectTopics.providerSubjectId, prefixedId)
                    )
                )
                .orderBy(
                    sql`ARRAY(SELECT CAST(m[1] AS integer) FROM regexp_matches(${providerSubjectTopics.name}, '(\d+)', 'g') AS m)`
                );
        }

        return await client
            .select()
            .from(providerSubjectTopics)
            .where(
                or(
                    eq(providerSubjectTopics.providerSubjectId, plainId),
                    eq(providerSubjectTopics.providerSubjectId, prefixedId)
                )
            )
            .orderBy(
                sql`ARRAY(SELECT CAST(m[1] AS integer) FROM regexp_matches(${providerSubjectTopics.name}, '(\d+)', 'g') AS m)`
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
        // Since it's JSONB now, we handle it slightly differently if we want to increment a specific key
        // or just store the total. User SQL had `questions_stats jsonb`.
        // Let's assume it stores { total: X } for now.
        return await client
            .update(providerSubjectTopics)
            .set({
                questionsStats: sql`jsonb_set(
                    COALESCE(${providerSubjectTopics.questionsStats}, '{}'::jsonb), 
                    '{total}', 
                    (COALESCE(${providerSubjectTopics.questionsStats}->>'total', '0')::int + ${count})::text::jsonb
                )`
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


    async deleteTopic(id: string, tx?: DbClient) {
        const client = tx ?? this.db;
        const result = await client
            .delete(providerSubjectTopics)
            .where(eq(providerSubjectTopics.id, id))
            .returning();
        return result[0];
    }
}
