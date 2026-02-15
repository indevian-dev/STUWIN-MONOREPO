import { unifiedApiHandler } from '@/lib/middleware/handlers';
import { okResponse, serverErrorResponse } from '@/lib/middleware/responses/ApiResponse';

export const GET = unifiedApiHandler(async (_request, { module, authData, params, log }) => {
  try {
    const accountId = authData.account.id;
    const { workspaceId } = params as { workspaceId: string };

    const result = await module.support.listBookmarks(accountId, workspaceId);

    if (!result.success) {
      return serverErrorResponse(result.error);
    }

    const questionIds = (result.data || []).map((f: any) => String(f.questionId));

    log.info('Bookmarked questions fetched', { count: questionIds.length });

    return okResponse(questionIds);
  } catch (error) {
    log.error('Error retrieving bookmarked questions', error as Error);
    return serverErrorResponse('Failed to retrieve bookmarks');
  }
});
