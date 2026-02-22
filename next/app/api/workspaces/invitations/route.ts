import { unifiedApiHandler } from '@/lib/middleware/_Middleware.index';
import { okResponse, serverErrorResponse } from '@/lib/middleware/Response.Api.middleware';

export const GET = unifiedApiHandler(async (_request, { module, auth, log }) => {
    try {
        const result = await module.workspace.getMyInvitations(auth.accountId);

        if (!result.success) {
            return serverErrorResponse(result.error || 'Failed to fetch invitations');
        }

        return okResponse(result.data);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Failed to fetch invitations';
        log.error('Error fetching invitations', { error: message });
        return serverErrorResponse(message);
    }
});
