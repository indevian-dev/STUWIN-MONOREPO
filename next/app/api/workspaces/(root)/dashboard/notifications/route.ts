import { NextRequest } from 'next/server';
import { unifiedApiHandler } from '@/lib/middleware/_Middleware.index';
import { okResponse, errorResponse, serverErrorResponse } from '@/lib/middleware/Response.Api.middleware';

/**
 * GET - Fetch account-level notifications for the dashboard
 * This endpoint is shared across all workspaces and fetches notifications
 * specifically for the authenticated account.
 */
export const GET = unifiedApiHandler(async (request: NextRequest, { authData, module }) => {
    if (!authData?.account?.id) {
        return errorResponse('Unauthorized', 401, "UNAUTHORIZED");
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '5');

    const result = await module.support.getNotificationsContext({
        accountId: authData.account.id,
        page,
        limit
    });

    if (!result.success) {
        return serverErrorResponse(result.error);
    }

    return okResponse(result.data);
});
