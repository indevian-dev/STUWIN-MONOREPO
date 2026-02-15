import { NextRequest } from 'next/server';
import { unifiedApiHandler } from '@/lib/middleware/handlers';
import { okResponse, errorResponse, serverErrorResponse } from '@/lib/middleware/responses/ApiResponse';

export const GET = unifiedApiHandler(async (request: NextRequest, { module, params }) => {
    try {
        const workspaceId = params.workspaceId;
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');

        if (!workspaceId) {
            return errorResponse('Workspace ID is required', 400);
        }

        const result = await module.workspace.listProviderMembers(workspaceId, page, limit);

        if (!result.success) {
            return serverErrorResponse(result.error);
        }

        return okResponse(result.data);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to list members';
        return serverErrorResponse(errorMessage);
    }
});
