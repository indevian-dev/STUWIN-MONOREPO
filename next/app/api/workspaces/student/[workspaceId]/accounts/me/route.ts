import { unifiedApiHandler } from '@/lib/middleware/_Middleware.index';
import { okResponse, errorResponse, serverErrorResponse } from '@/lib/middleware/Response.Api.middleware';

/**
 * GET /api/workspaces/student/[workspaceId]/accounts/me
 * 
 * Fetches student account data with workspace-specific roles and permissions
 * Decoupled into AuthService
 */
export const GET = unifiedApiHandler(async (request, { auth, module, log, params }) => {
  try {
    const accountId = auth.accountId;
    const workspaceId = params.workspaceId as string;

    if (!accountId) {
      return errorResponse('Unauthorized', 401, "UNAUTHORIZED");
    }

    log.debug('Fetching account profile', { accountId, workspaceId });

    // Delegate to AuthService
    const result = await module.auth.getAccountProfile(accountId, workspaceId);

    if (!result.success) {
      log.warn('Failed to fetch account profile', { accountId, error: result.error });
      return errorResponse(result.error, result.status);
    }

    log.info('Account profile fetched', { accountId });
    return okResponse(result.data);
  } catch (error) {
    log.error('Error in account profile route', error);
    return serverErrorResponse('Internal server error');
  }
}, {
  authRequired: true
});
