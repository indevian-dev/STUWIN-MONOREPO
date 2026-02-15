// ═══════════════════════════════════════════════════════════════
// GET /api/workspaces/discover - Discover Public Workspaces
// ═══════════════════════════════════════════════════════════════

import { unifiedApiHandler } from '@/lib/middleware/handlers';
import { okResponse, serverErrorResponse } from '@/lib/middleware/responses/ApiResponse';

/**
 * GET /api/workspaces/discover
 * List educational organizations that users can join
 */
export const GET = unifiedApiHandler(async (request, { auth, module }) => {
    try {
        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '10');
        const offset = parseInt(searchParams.get('offset') || '0');
        const query = searchParams.get('query') || '';

        // Call Service (assuming listProviders handles query or just lists active ones)
        const result = await module.workspace.listProviders({ limit, offset });

        if (!result.success) {
            throw new Error(result.error || "Failed to fetch discovery list");
        }

        return okResponse(result);
    } catch (error) {
        console.error('Error in discovery API:', error);
        return serverErrorResponse(error instanceof Error ? error.message : 'Discovery failed',);
    }
}, {
    authRequired: true,
});

