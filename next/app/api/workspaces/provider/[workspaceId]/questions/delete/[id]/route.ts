
import { NextResponse } from 'next/server';
import { unifiedApiHandler } from '@/lib/middleware/handlers';
import { generateSlimId } from '@/lib/utils/ids/SlimUlidUtil';

export const DELETE = unifiedApiHandler(async (request, { module, params, auth }) => {
  const id = params?.id;

  if (!id) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  const result = await module.question.delete(id);

  if (!result.success || !result.data) {
    return NextResponse.json({ error: result.error || "Question not found" }, { status: 404 });
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

  return NextResponse.json({
    operation: 'success',
    message: 'Question deleted successfully',
    deletedQuestionId: id
  }, { status: 200 });
});
