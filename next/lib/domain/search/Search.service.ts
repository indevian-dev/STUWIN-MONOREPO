import { BaseService } from "../base/Base.service";
import { AuthContext } from "@/lib/domain/base/Base.types";
import { Database } from "@/lib/database";
import { schema } from "@/lib/database";
import { eq } from "drizzle-orm";
import { SearchRepository } from "./Search.repository";
import type { SearchQuestionFilters, SearchQuestionsResponse, SyncResult } from "./Search.types";

// ═══════════════════════════════════════════════════════════════
// SEARCH SERVICE — Syncs questions to Neon + BM25 search
// ═══════════════════════════════════════════════════════════════

export class SearchService extends BaseService {
    constructor(
        private readonly repository: SearchRepository,
        private readonly ctx: AuthContext,
        private readonly db: Database,
    ) {
        super();
    }

    // ─── SYNC OPERATIONS ─────────────────────────────────────────

    /**
     * Sync a single question to the search index.
     * Called after create/update in QuestionService.
     */
    async syncQuestion(questionId: string): Promise<{ success: boolean; error?: string }> {
        try {
            const question = await this.db
                .select()
                .from(schema.providerQuestions)
                .where(eq(schema.providerQuestions.id, questionId))
                .limit(1);

            if (!question[0]) {
                return { success: false, error: "Question not found" };
            }

            const row = question[0];
            const data = this.buildJsonbData(row);

            await this.repository.upsertQuestion(
                row.id,
                row.workspaceId || "",
                data,
            );

            return { success: true };
        } catch (error: unknown) {
            this.handleError(error, "syncQuestion");
            return { success: false, error: "Failed to sync question" };
        }
    }

    /**
     * Sync all questions for a workspace to the search index.
     * Used for initial setup or recovery.
     */
    async syncAllQuestions(workspaceId: string): Promise<SyncResult> {
        const result: SyncResult = { synced: 0, failed: 0, errors: [] };

        try {
            const questions = await this.db
                .select()
                .from(schema.providerQuestions)
                .where(eq(schema.providerQuestions.workspaceId, workspaceId));

            for (const row of questions) {
                try {
                    const data = this.buildJsonbData(row);
                    await this.repository.upsertQuestion(row.id, workspaceId, data);
                    result.synced++;
                } catch (error: unknown) {
                    result.failed++;
                    result.errors.push(`Failed to sync question ${row.id}: ${error instanceof Error ? error.message : "Unknown error"}`);
                }
            }

            // Clean up orphaned entries (deleted from Supabase but still in Neon)
            const syncedIds = await this.repository.getSyncedIds(workspaceId);
            const sourceIds = new Set(questions.map(q => q.id));
            for (const syncedId of syncedIds) {
                if (!sourceIds.has(syncedId)) {
                    await this.repository.deleteQuestion(syncedId);
                }
            }

            return result;
        } catch (error: unknown) {
            this.handleError(error, "syncAllQuestions");
            return { ...result, errors: [...result.errors, "Sync aborted due to error"] };
        }
    }

    /**
     * Remove a question from the search index.
     * Called after delete in QuestionService.
     */
    async deleteFromIndex(questionId: string): Promise<{ success: boolean; error?: string }> {
        try {
            await this.repository.deleteQuestion(questionId);
            return { success: true };
        } catch (error: unknown) {
            this.handleError(error, "deleteFromIndex");
            return { success: false, error: "Failed to delete from search index" };
        }
    }

    // ─── SEARCH OPERATIONS ───────────────────────────────────────

    /**
     * Full-text search questions using ParadeDB BM25
     */
    async searchQuestions(filters: SearchQuestionFilters): Promise<SearchQuestionsResponse> {
        try {
            const page = filters.page || 1;
            const pageSize = filters.pageSize || 20;

            const { results, total } = await this.repository.searchQuestions(filters);

            return {
                results,
                total,
                page,
                pageSize,
                query: filters.query,
            };
        } catch (error: unknown) {
            this.handleError(error, "searchQuestions");
            return { results: [], total: 0, page: 1, pageSize: 20, query: filters.query };
        }
    }

    /**
     * Get sync status for a workspace
     */
    async getSyncStatus(workspaceId: string): Promise<{ indexed: number }> {
        try {
            const count = await this.repository.countByWorkspace(workspaceId);
            return { indexed: count };
        } catch (error: unknown) {
            this.handleError(error, "getSyncStatus");
            return { indexed: 0 };
        }
    }

    /**
     * Get random questions from the search index for quiz start.
     * Offloads question selection from Supabase to Neon.
     */
    async getQuestionsForQuiz(params: {
        workspaceId: string;
        limit: number;
        subjectId?: string | null;
        gradeLevel?: number | null;
        complexity?: string | null;
        language?: string | null;
    }): Promise<Record<string, unknown>[]> {
        try {
            return await this.repository.getRandomQuestions(params);
        } catch (error: unknown) {
            this.handleError(error, "getQuestionsForQuiz");
            return [];
        }
    }

    // ─── PRIVATE HELPERS ─────────────────────────────────────────

    /**
     * Transform a raw DB row into the JSONB payload for Neon.
     * Stores all columns as flat JSON keys for ParadeDB indexing.
     */
    private buildJsonbData(row: typeof schema.providerQuestions.$inferSelect): Record<string, unknown> {
        // Use snake_case keys to match to_jsonb(NEW) output from FDW trigger
        return {
            id: row.id,
            question: row.question,
            answers: row.answers,
            correct_answer: row.correctAnswer,
            complexity: row.complexity,
            grade_level: row.gradeLevel,
            language: row.language,
            provider_subject_id: row.providerSubjectId,
            provider_subject_topic_id: row.providerSubjectTopicId,
            author_account_id: row.authorAccountId,
            reviewer_account_id: row.reviewerAccountId,
            is_published: row.isPublished,
            explanation_guide: row.explanationGuide,
            ai_guide: row.aiGuide,
            created_at: row.createdAt?.toISOString(),
            updated_at: row.updatedAt?.toISOString(),
        };
    }
}
