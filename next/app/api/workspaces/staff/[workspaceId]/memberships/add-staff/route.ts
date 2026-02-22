import { NextRequest } from 'next/server';
import { unifiedApiHandler } from '@/lib/middleware/_Middleware.index';

import { createdResponse, errorResponse, serverErrorResponse } from '@/lib/middleware/Response.Api.middleware';
export const POST = unifiedApiHandler(async (request: NextRequest, { module }) => {
    try {
        const body = await request.json();
        const { accountId, targetWorkspaceId, accessRole } = body;

        if (!accountId || !targetWorkspaceId || !accessRole) {
            return errorResponse("accountId, targetWorkspaceId, and accessRole are required");
        }

        const result = await module.workspace.addUserToStaffWorkspace({
            accountId,
            targetWorkspaceId,
            accessRole,
        });

        if (!result.success) {
            return errorResponse(result.error, 400);
        }

        return createdResponse(result.data);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to add staff member';
        return serverErrorResponse(errorMessage);
    }
});
