
import { eq, or, sql } from "drizzle-orm";
import { providerSubjectTopics } from "@/lib/database/schema";
import { BaseRepository } from "../base/Base.repository";
import { type DbClient } from "@/lib/database";

/**
 * TopicRepository - Database operations for Topic entities
 */
export class TopicRepository extends BaseRepository {

    async findById(id: string, tx?: DbClient) {
        const client = tx ?? this.db;
        const result = await client
            .select()
            .from(providerSubjectTopics)
            .where(eq(providerSubjectTopics.id, id))
            .limit(1);
        return result[0] || null;
    }

    async listBySubject(subjectId: string, options?: { excludeVector?: boolean }, tx?: DbClient) {
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
                .where(or(eq(providerSubjectTopics.providerSubjectId, plainId), eq(providerSubjectTopics.providerSubjectId, prefixedId)))
                .orderBy(sql`ARRAY(SELECT CAST(m[1] AS integer) FROM regexp_matches(${providerSubjectTopics.name}, '(\\d+)', 'g') AS m)`);
        }

        return await client
            .select()
            .from(providerSubjectTopics)
            .where(or(eq(providerSubjectTopics.providerSubjectId, plainId), eq(providerSubjectTopics.providerSubjectId, prefixedId)))
            .orderBy(sql`ARRAY(SELECT CAST(m[1] AS integer) FROM regexp_matches(${providerSubjectTopics.name}, '(\\d+)', 'g') AS m)`);
    }

    async create(data: typeof providerSubjectTopics.$inferInsert, tx?: DbClient) {
        const client = tx ?? this.db;
        const result = await client.insert(providerSubjectTopics).values(data).returning();
        return result[0];
    }

    async bulkCreate(data: (typeof providerSubjectTopics.$inferInsert)[], tx?: DbClient) {
        const client = tx ?? this.db;
        return await client.insert(providerSubjectTopics).values(data).returning();
    }

    async update(id: string, data: Partial<typeof providerSubjectTopics.$inferInsert>, tx?: DbClient) {
        const client = tx ?? this.db;
        const result = await client.update(providerSubjectTopics).set(data).where(eq(providerSubjectTopics.id, id)).returning();
        return result[0];
    }

    async incrementQuestionStats(topicId: string, count: number, tx?: DbClient) {
        const client = tx ?? this.db;
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

    async delete(id: string, tx?: DbClient) {
        const client = tx ?? this.db;
        const result = await client.delete(providerSubjectTopics).where(eq(providerSubjectTopics.id, id)).returning();
        return result[0];
    }
}
