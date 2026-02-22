import { unifiedApiHandler } from '@/lib/middleware/_Middleware.index';
import { createdResponse, errorResponse, serverErrorResponse } from '@/lib/middleware/Response.Api.middleware';

export const POST = unifiedApiHandler(async (_request, { module, authData, params, log, isValidSlimId }) => {
  try {
    const { id: questionId } = params as { id: string };
    const accountId = authData.account.id;
    const workspaceId = authData.account.workspaceId || "";

    if (!questionId || !isValidSlimId(questionId)) {
      return errorResponse('Valid question ID is required', 400);
    }

    log.info('Adding question bookmark', { questionId, accountId });

    // Check if question exists and is published
    const questionResult = await module.question.getById(questionId);

    if (!questionResult.success || !questionResult.data) {
      return errorResponse('Question not found', 404, "NOT_FOUND");
    }

    const questionPub = questionResult.data;
    if (!questionPub.isPublished) {
      return errorResponse('Question is not active', 400);
    }

    // Create bookmark via support module
    const result = await module.support.addBookmark({
      accountId,
      questionId,
      workspaceId
    });

    if (!result.success || !result.data) {
      if (result.code === 'ALREADY_BOOKMARKED') {
        return errorResponse('Question is already bookmarked', 409);
      }
      return serverErrorResponse(result.error || 'Failed to add bookmark');
    }

    log.info('Question bookmarked', {
      questionId,
      favoriteId: result.data.id
    });

    return createdResponse(result.data, 'Question bookmarked successfully');

  } catch (error) {
    log.error('Error bookmarking question', error as Error);
    return serverErrorResponse('Failed to bookmark question');
  }
});
