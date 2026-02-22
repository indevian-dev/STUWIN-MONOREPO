
import { unifiedApiHandler } from '@/lib/middleware/_Middleware.index';
import { okResponse, serverErrorResponse } from '@/lib/middleware/Response.Api.middleware';

export const GET = unifiedApiHandler(async (_request, { module, log }) => {
  log.debug('Fetching roles');

  const result = await module.roles.getAllRoles();

  if (!result.success) {
    return serverErrorResponse(result.error);
  }

  log.info('Roles fetched', { count: result.roles?.length });
  return okResponse(result.roles);
});
