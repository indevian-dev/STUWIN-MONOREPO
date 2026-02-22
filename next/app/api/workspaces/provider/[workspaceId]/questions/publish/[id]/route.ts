
import { unifiedApiHandler } from '@/lib/middleware/_Middleware.index';
import { generateSlimId } from '@/lib/utils/Helper.SlimUlid.util'; // If needed for legacy ID gen
import { okResponse, errorResponse, serverErrorResponse } from '@/lib/middleware/Response.Api.middleware';

export const POST = unifiedApiHandler(async (request, { module, params }) => {
  const { id, workspaceId } = await params;

  if (!id) {
    return errorResponse("Invalid ID", 400);
  }

  const questionId = id as string;
  const body = await request.json();
  const { approved = false, reasons = [], reasonText = '' } = body;

  // Fetch question to get author ID
  const qResult = await module.question.getById(questionId);
  if (!qResult.success || !qResult.data) {
    return errorResponse("Question not found", 404, "NOT_FOUND");
  }
  const question = qResult.data;

  let result;
  if (approved) {
    // Approve & Publish
    result = await module.question.setPublished(questionId, true);

    if (result.success && question.authorAccountId) {
      await module.content.supportRepo.createNotification({
        payload: {
          type: 'Question Approved',
          message: 'Your question has been approved and published',
        },
        markAsRead: false,
        accountId: question.authorAccountId,
        workspaceId: workspaceId as string
      });
    }
  } else {
    // Reject & Unpublish (Ensure draft)
    result = await module.question.setPublished(questionId, false);

    const reasonsList = reasons?.join(', ') || '';
    const rejectMessage = reasonText
      ? `Your question was rejected. Issues: ${reasonsList}. ${reasonText}`
      : `Your question was rejected. Issues: ${reasonsList}`;

    if (question.authorAccountId) {
      await module.content.supportRepo.createNotification({
        payload: {
          type: 'Question Rejected',
          message: rejectMessage,
        },
        markAsRead: false,
        accountId: question.authorAccountId,
        workspaceId: workspaceId as string
      });
    }
  }

  if (!result.success) {
    return serverErrorResponse(result.error);
  }

  return okResponse({
    questionId,
    approved,
    reasons: approved ? null : reasons,
    reasonText: approved ? null : reasonText
  }, `Question ${approved ? 'approved' : 'rejected'} successfully`);
});
