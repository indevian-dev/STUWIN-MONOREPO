import { unifiedApiHandler } from '@/lib/middleware/_Middleware.index';
import { okResponse, errorResponse, serverErrorResponse } from '@/lib/middleware/Response.Api.middleware';

export const DELETE = unifiedApiHandler(async (_request, { module, authData, params, log, isValidSlimId }) => {
  try {
    const { id: questionId } = params as { id: string };
    const accountId = authData.account.id;

    if (!questionId || !isValidSlimId(questionId)) {
      return errorResponse('Valid question ID is required', 400);
    }

    log.info('Removing question bookmark', { questionId, accountId });

    const result = await module.support.removeBookmark(accountId, questionId);

    if (!result.success || !result.data) {
      if (result.code === 'BOOKMARK_NOT_FOUND') {
        return errorResponse('Favorite not found', 404, "NOT_FOUND");
      }
      return serverErrorResponse(result.error || 'Failed to remove bookmark');
    }

    log.info('Question bookmark removed', { questionId });
    return okResponse(result.data, 'Question removed from bookmarks successfully');

  } catch (error) {
    log.error('Error removing question bookmark', error as Error);
    return serverErrorResponse('Failed to remove question bookmark');
  }
});
