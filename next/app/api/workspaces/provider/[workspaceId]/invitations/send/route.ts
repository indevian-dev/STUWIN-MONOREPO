import { NextRequest } from 'next/server';
import { unifiedApiHandler } from '@/lib/middleware/_Middleware.index';
import { okResponse, errorResponse, serverErrorResponse } from '@/lib/middleware/Response.Api.middleware';

export const POST = unifiedApiHandler(async (request: NextRequest, { module, params, auth }) => {
    try {
        const workspaceId = params.workspaceId;

        if (!workspaceId) {
            return errorResponse('Workspace ID is required', 400);
        }

        const body = await request.json();
        const { email, role } = body;

        if (!email) {
            return errorResponse('Email is required', 400);
        }
        if (!role) {
            return errorResponse('Role is required', 400);
        }

        const result = await module.workspace.inviteMember(
            workspaceId,
            auth.accountId,
            email,
            role
        );

        if (!result.success) {
            return errorResponse(result.error || 'Failed to send invitation', 400);
        }

        return okResponse(result.data);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to send invitation';
        return serverErrorResponse(errorMessage);
    }
});
