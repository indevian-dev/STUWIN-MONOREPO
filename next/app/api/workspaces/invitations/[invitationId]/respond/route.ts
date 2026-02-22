import { unifiedApiHandler } from '@/lib/middleware/_Middleware.index';
import { okResponse, errorResponse, serverErrorResponse } from '@/lib/middleware/Response.Api.middleware';

export const POST = unifiedApiHandler(async (request, { module, auth, params, log }) => {
    try {
        const invitationId = params?.invitationId as string;

        if (!invitationId) {
            return errorResponse('Invitation ID is required', 400);
        }

        const body = await request.json();
        const { action } = body;

        if (!action || !['approve', 'decline'].includes(action)) {
            return errorResponse('Action must be "approve" or "decline"', 400);
        }

        const result = await module.workspace.respondToInvitation(
            invitationId,
            auth.accountId,
            action as 'approve' | 'decline'
        );

        if (!result.success) {
            return errorResponse(result.error || 'Failed to respond to invitation', 400);
        }

        return okResponse(result);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Failed to respond to invitation';
        log.error('Error responding to invitation', { error: message });
        return serverErrorResponse(message);
    }
});
