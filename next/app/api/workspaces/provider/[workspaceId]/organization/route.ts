import { NextRequest } from 'next/server';
import { unifiedApiHandler } from '@/lib/middleware/handlers';
import { okResponse, errorResponse, serverErrorResponse } from '@/lib/middleware/responses/ApiResponse';

export const GET = unifiedApiHandler(async (_request: NextRequest, { module, params }) => {
    try {
        const workspaceId = params.workspaceId;
        if (!workspaceId) {
            return errorResponse('Workspace ID is required', 400);
        }

        const result = await module.workspace.getWorkspace(workspaceId);

        if (!result.success || !result.workspace) {
            return errorResponse('Workspace not found', 404);
        }

        const ws = result.workspace;
        return okResponse({
            id: ws.id,
            title: ws.title,
            type: ws.type,
            profile: ws.profile || {},
            isActive: ws.isActive,
            cityId: ws.cityId,
            createdAt: ws.createdAt,
            updatedAt: ws.updatedAt,
        });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch organization';
        return serverErrorResponse(errorMessage);
    }
});
