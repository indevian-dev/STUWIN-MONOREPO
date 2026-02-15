import { unifiedApiHandler } from '@/lib/middleware/handlers';
import { okResponse, errorResponse } from '@/lib/middleware/responses/ApiResponse';

export const GET = unifiedApiHandler(async (_request, { module, params, log, isValidSlimId }) => {
  const { id } = params as { id: string };

  if (!id || !isValidSlimId(id)) {
    return errorResponse('Valid provider ID is required', 400);
  }

  log.debug('Fetching provider', { id });

  const result = await module.workspace.getWorkspace(id);

  if (!result) {
    return errorResponse('Provider not found', 404, "NOT_FOUND");
  }

  log.info('Provider fetched', { id });
  return okResponse(result);
});
