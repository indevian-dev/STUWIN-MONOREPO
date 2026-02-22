import { paradeDbClient } from "@/lib/integrations/paradedb/PgsqlSearch.client";
import type { SearchQuestionFilters, SearchQuestionResult } from "./Search.types";

// ═══════════════════════════════════════════════════════════════
// SEARCH REPOSITORY — Raw SQL against Neon PgSQL + ParadeDB
// ═══════════════════════════════════════════════════════════════

export class SearchRepository {

    /**
     * Upsert a question into the search index as JSONB
     */
    async upsertQuestion(id: string, workspaceId: string, data: Record<string, unknown>): Promise<void> {
        await paradeDbClient`
            INSERT INTO search_questions (id, workspace_id, data, synced_at)
            VALUES (${id}, ${workspaceId}, ${JSON.stringify(data)}::jsonb, NOW())
            ON CONFLICT (id) DO UPDATE SET
                data = ${JSON.stringify(data)}::jsonb,
                workspace_id = ${workspaceId},
                synced_at = NOW()
        `;
    }

    /**
     * Delete a question from the search index
     */
    async deleteQuestion(id: string): Promise<void> {
        await paradeDbClient`DELETE FROM search_questions WHERE id = ${id}`;
    }

    /**
     * BM25 full-text search with workspace scoping and filters
     */
    async searchQuestions(filters: SearchQuestionFilters): Promise<{ results: SearchQuestionResult[]; total: number }> {
        const page = filters.page || 1;
        const pageSize = filters.pageSize || 20;
        const offset = (page - 1) * pageSize;

        // Build ParadeDB search query parts
        const searchParts: string[] = [];

        // Main text search across question content
        if (filters.query) {
            // Escape special characters for ParadeDB query syntax
            const escapedQuery = filters.query.replace(/[+\-&|!(){}[\]^"~*?:\\/]/g, '\\$&');
            searchParts.push(`data.question:${escapedQuery}`);
        }

        // Filter clauses
        const filterParts: string[] = [];
        if (filters.complexity) {
            filterParts.push(`data.complexity:${filters.complexity}`);
        }
        if (filters.gradeLevel) {
            filterParts.push(`data.grade_level:${filters.gradeLevel}`);
        }
        if (filters.language) {
            filterParts.push(`data.language:${filters.language}`);
        }
        if (filters.subjectId) {
            filterParts.push(`data.provider_subject_id:${filters.subjectId}`);
        }
        if (filters.isPublished !== undefined) {
            filterParts.push(`data.is_published:${filters.isPublished}`);
        }

        // Combine into ParadeDB boolean query
        const mustClause = searchParts.length > 0 ? searchParts.join(' AND ') : '*';
        const filterClause = filterParts.length > 0 ? ` AND ${filterParts.join(' AND ')}` : '';
        const fullQuery = `${mustClause}${filterClause}`;

        const results = await paradeDbClient`
            SELECT 
                id, 
                workspace_id AS "workspaceId",
                data, 
                paradedb.score(id) AS score,
                synced_at AS "syncedAt"
            FROM search_questions
            WHERE data @@@ ${fullQuery}
              AND workspace_id = ${filters.workspaceId}
            ORDER BY score DESC
            LIMIT ${pageSize}
            OFFSET ${offset}
        `;

        const countResult = await paradeDbClient`
            SELECT COUNT(*)::int AS total
            FROM search_questions
            WHERE data @@@ ${fullQuery}
              AND workspace_id = ${filters.workspaceId}
        `;

        return {
            results: results as unknown as SearchQuestionResult[],
            total: countResult[0]?.total || 0,
        };
    }

    /**
     * Count all synced questions for a workspace
     */
    async countByWorkspace(workspaceId: string): Promise<number> {
        const result = await paradeDbClient`
            SELECT COUNT(*)::int AS total 
            FROM search_questions 
            WHERE workspace_id = ${workspaceId}
        `;
        return result[0]?.total || 0;
    }

    /**
     * Get all synced question IDs for a workspace (used for diff sync)
     */
    async getSyncedIds(workspaceId: string): Promise<string[]> {
        const result = await paradeDbClient`
            SELECT id FROM search_questions WHERE workspace_id = ${workspaceId}
        `;
        return result.map((r) => (r as Record<string, string>).id);
    }

    /**
     * Get random questions from the search index filtered by JSONB fields.
     * Used by QuizService.start() to select quiz questions from Neon.
     */
    async getRandomQuestions(params: {
        workspaceId: string;
        limit: number;
        subjectId?: string | null;
        gradeLevel?: number | null;
        complexity?: string | null;
        language?: string | null;
    }): Promise<Record<string, unknown>[]> {
        // Build WHERE conditions for JSONB filtering (snake_case keys from to_jsonb)
        const conditions: string[] = [
            `workspace_id = '${params.workspaceId}'`,
            `(data->>'is_published')::boolean = true`,
        ];

        if (params.subjectId) {
            conditions.push(`data->>'provider_subject_id' = '${params.subjectId}'`);
        }
        if (params.gradeLevel) {
            conditions.push(`(data->>'grade_level')::int = ${params.gradeLevel}`);
        }
        if (params.complexity) {
            conditions.push(`data->>'complexity' = '${params.complexity}'`);
        }
        if (params.language) {
            conditions.push(`data->>'language' = '${params.language}'`);
        }

        const whereClause = conditions.join(' AND ');

        const results = await paradeDbClient.unsafe(`
            SELECT id, data
            FROM search_questions
            WHERE ${whereClause}
            ORDER BY RANDOM()
            LIMIT ${params.limit}
        `);

        return results.map((r) => ({
            ...(r.data as Record<string, unknown>),
            id: r.id,
        }));
    }
}
