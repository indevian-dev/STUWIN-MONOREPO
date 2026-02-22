
import { unifiedApiHandler } from '@/lib/middleware/_Middleware.index';
import { generateSlimId } from '@/lib/utils/Helper.SlimUlid.util';
import { okResponse, errorResponse } from '@/lib/middleware/Response.Api.middleware';

export const DELETE = unifiedApiHandler(async (request, { module, params, auth }) => {
  const id = params?.id;

  if (!id) {
    return errorResponse("Invalid ID", 400);
  }

  const result = await module.question.delete(id);

  if (!result.success || !result.data) {
    return errorResponse(result.error || "Question not found", 404);
  }

  const deletedQuestion = result.data;

  // Send notification to author if they exist
  if (deletedQuestion.authorAccountId) {
    try {
      const questionText = deletedQuestion.question
        ? `"${deletedQuestion.question.substring(0, 50)}..."`
        : 'Question';

      await module.content.supportRepo.createNotification({
        name: 'Question Deleted by Admin',
        body: `Your question ${questionText} has been deleted by an administrator`,
        markAsRead: false,
        accountId: deletedQuestion.authorAccountId,
        workspaceId: deletedQuestion.workspaceId || 'system',
        createdAt: new Date(),
        updatedAt: new Date()
      } as any);
    } catch (e) {
      console.error("Failed to crate notification", e);
      // Non-blocking
    }
  }

  return okResponse({ operation: 'success', deletedQuestionId: id }, 'Question deleted successfully');
});
