import { unifiedApiHandler } from '@/lib/middleware/handlers';
import { okResponse, errorResponse } from '@/lib/middleware/responses/ApiResponse';

export const GET = unifiedApiHandler(async (_request, { module, params, authData, log, isValidSlimId }) => {
  const { id } = params as { id: string };

  if (!id || !isValidSlimId(id)) {
    return errorResponse('Valid question ID is required', 400);
  }

  log.debug('Fetching user question', { id, accountId: authData.account.id });

  const result = await module.question.getById(id);

  if (!result.success || !result.data) {
    return errorResponse(result.error || 'Question not found', 404);
  }

  // Check ownership
  if (result.data.authorAccountId !== authData.account.id) {
    return errorResponse('Access denied', 403, "FORBIDDEN");
  }

  log.info('User question fetched', { id });

  return okResponse(module.question.mapToLegacy(result.data));
});
