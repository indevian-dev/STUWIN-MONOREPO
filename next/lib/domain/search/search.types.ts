// ═══════════════════════════════════════════════════════════════
// SEARCH TYPES
// ═══════════════════════════════════════════════════════════════

/**
 * Filters for searching questions via ParadeDB BM25
 */
export interface SearchQuestionFilters {
    query: string;
    workspaceId: string;
    complexity?: string;
    gradeLevel?: number;
    language?: string;
    subjectId?: string;
    isPublished?: boolean;
    page?: number;
    pageSize?: number;
}

/**
 * Single search result with BM25 relevance score
 */
export interface SearchQuestionResult {
    id: string;
    data: Record<string, unknown>;
    score: number;
    workspaceId: string;
    syncedAt: string;
}

/**
 * Paginated search response
 */
export interface SearchQuestionsResponse {
    results: SearchQuestionResult[];
    total: number;
    page: number;
    pageSize: number;
    query: string;
}

/**
 * Sync status for a batch operation
 */
export interface SyncResult {
    synced: number;
    failed: number;
    errors: string[];
}
