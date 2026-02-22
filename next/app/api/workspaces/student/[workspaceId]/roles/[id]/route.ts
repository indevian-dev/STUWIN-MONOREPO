
import { unifiedApiHandler } from '@/lib/middleware/_Middleware.index';
import { okResponse, errorResponse } from '@/lib/middleware/Response.Api.middleware';

export const GET = unifiedApiHandler(async (_request, { module, params, log, isValidSlimId }) => {
  const { id } = params as { id: string };

  if (!id || !isValidSlimId(id)) {
    return errorResponse('Valid role ID is required', 400);
  }

  log.debug('Fetching role', { id });

  const result = await module.roles.getRole(id);

  if (!result.success) {
    return errorResponse(result.error || 'Failed to fetch role', result.status);
  }

  log.info('Role fetched', { id });
  return okResponse(result.role);
});
