import { unifiedApiHandler } from '@/lib/middleware/_Middleware.index';
import { okResponse } from '@/lib/middleware/Response.Api.middleware';

/**
 * GET /api/workspaces/provider/[workspaceId]/search/questions
 * 
 * Full-text search questions using ParadeDB BM25 on Neon PgSQL.
 * Query params: q, complexity, gradeLevel, language, subjectId, page, pageSize
 */
export const GET = unifiedApiHandler(async (request, { module, params }) => {
    const { searchParams } = new URL(request.url);
    const workspaceId = params?.workspaceId as string;

    const query = searchParams.get('q') || '';
    if (!query.trim()) {
        return okResponse({ results: [], total: 0, page: 1, pageSize: 20, query: '' });
    }

    const result = await module.search.searchQuestions({
        query,
        workspaceId,
        complexity: searchParams.get('complexity') || undefined,
        gradeLevel: searchParams.get('gradeLevel') ? parseInt(searchParams.get('gradeLevel')!, 10) : undefined,
        language: searchParams.get('language') || undefined,
        subjectId: searchParams.get('subjectId') || undefined,
        page: parseInt(searchParams.get('page') || '1', 10),
        pageSize: parseInt(searchParams.get('pageSize') || '20', 10),
    });

    return okResponse(result);
});
