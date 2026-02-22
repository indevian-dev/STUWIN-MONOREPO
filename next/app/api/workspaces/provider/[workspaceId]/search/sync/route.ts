import { unifiedApiHandler } from '@/lib/middleware/_Middleware.index';
import { okResponse } from '@/lib/middleware/Response.Api.middleware';

/**
 * POST /api/workspaces/provider/[workspaceId]/search/sync
 * 
 * Trigger a full sync of all workspace questions to the search index.
 * Intended for admin use / recovery.
 */
export const POST = unifiedApiHandler(async (_request, { module, params }) => {
    const workspaceId = params?.workspaceId as string;

    const result = await module.search.syncAllQuestions(workspaceId);

    return okResponse({
        message: `Sync complete: ${result.synced} synced, ${result.failed} failed`,
        ...result,
    });
});

/**
 * GET /api/workspaces/provider/[workspaceId]/search/sync
 * 
 * Get sync status for the workspace.
 */
export const GET = unifiedApiHandler(async (_request, { module, params }) => {
    const workspaceId = params?.workspaceId as string;

    const status = await module.search.getSyncStatus(workspaceId);

    return okResponse(status);
});
