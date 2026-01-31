import { NextResponse } from 'next/server';
import { unifiedApiHandler } from '@/lib/app-access-control/interceptors';

export const POST = unifiedApiHandler(async (_request, { module, authData, params, log, isValidSlimId }) => {
  try {
    const { id: questionId } = params as { id: string };
    const accountId = authData.account.id;
    const workspaceId = authData.account.workspaceId || "";

    if (!questionId || !isValidSlimId(questionId)) {
      return NextResponse.json(
        { error: 'Valid question ID is required' },
        { status: 400 }
      );
    }

    log.info('Adding question bookmark', { questionId, accountId });

    // Check if question exists and is published
    const questionResult = await module.learning.getQuestionById(questionId);

    if (!questionResult.success || !questionResult.data) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    const questionPub = questionResult.data;
    if (!questionPub.isPublished) {
      return NextResponse.json({ error: 'Question is not active' }, { status: 400 });
    }

    // Create bookmark via support module
    const result = await module.support.addBookmark({
      accountId,
      questionId,
      workspaceId
    });

    if (!result.success || !result.data) {
      if (result.code === 'ALREADY_BOOKMARKED') {
        return NextResponse.json({ error: 'Question is already bookmarked' }, { status: 409 });
      }
      return NextResponse.json({ error: result.error || 'Failed to add bookmark' }, { status: 500 });
    }

    log.info('Question bookmarked', {
      questionId,
      favoriteId: result.data.id
    });

    return NextResponse.json({
      message: 'Question bookmarked successfully',
      favorite: result.data,
      questionPublished: questionPub
    }, { status: 201 });

  } catch (error) {
    log.error('Error bookmarking question', error as Error);
    return NextResponse.json(
      { error: 'Failed to bookmark question' },
      { status: 500 }
    );
  }
});
