import { NextRequest } from 'next/server';
import { unifiedApiHandler } from '@/lib/middleware/_Middleware.index';

import { okResponse, errorResponse, serverErrorResponse } from '@/lib/middleware/Response.Api.middleware';
export const GET = unifiedApiHandler(async (request: NextRequest, { module, params }) => {
    try {
        const accountId = params.id;

        if (!accountId) {
            return errorResponse("Account ID is required");
        }

        const result = await module.workspace.listWorkspacesForAccount(accountId);

        if (!result.success) {
            return serverErrorResponse(result.error);
        }

        return okResponse(result.data);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to list workspaces';
        return serverErrorResponse(errorMessage);
    }
});
