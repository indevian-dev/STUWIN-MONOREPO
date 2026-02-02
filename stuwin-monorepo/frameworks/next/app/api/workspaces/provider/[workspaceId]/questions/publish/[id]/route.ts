
import { NextResponse } from 'next/server';
import { unifiedApiHandler } from '@/lib/app-access-control/interceptors';
import { generateSlimId } from '@/lib/utils/slimUlidUtility'; // If needed for legacy ID gen

export const POST = unifiedApiHandler(async (request, { module, params }) => {
  const { id, workspaceId } = await params;

  if (!id) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  const questionId = id as string;
  const body = await request.json();
  const { approved = false, reasons = [], reasonText = '' } = body;

  // Fetch question to get author ID
  const qResult = await module.learning.getQuestionById(questionId);
  if (!qResult.success || !qResult.data) {
    return NextResponse.json({ error: "Question not found" }, { status: 404 });
  }
  const question = qResult.data;

  let result;
  if (approved) {
    // Approve & Publish
    result = await module.learning.setQuestionPublished(questionId, true);

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
    result = await module.learning.setQuestionPublished(questionId, false);

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
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({
    message: `Question ${approved ? 'approved' : 'rejected'} successfully`,
    data: {
      questionId,
      approved,
      reasons: approved ? null : reasons,
      reasonText: approved ? null : reasonText
    }
  }, { status: 200 });
});
