import { NextResponse } from 'next/server';
import { unifiedApiHandler } from '@/lib/middleware/handlers';

export const DELETE = unifiedApiHandler(async (_request, { module, authData, params, log, isValidSlimId }) => {
  try {
    const { id: questionId } = params as { id: string };
    const accountId = authData.account.id;

    if (!questionId || !isValidSlimId(questionId)) {
      return NextResponse.json(
        { error: 'Valid question ID is required' },
        { status: 400 }
      );
    }

    log.info('Removing question bookmark', { questionId, accountId });

    const result = await module.support.removeBookmark(accountId, questionId);

    if (!result.success || !result.data) {
      if (result.code === 'BOOKMARK_NOT_FOUND') {
        return NextResponse.json({ error: 'Favorite not found' }, { status: 404 });
      }
      return NextResponse.json({ error: result.error || 'Failed to remove bookmark' }, { status: 500 });
    }

    log.info('Question bookmark removed', { questionId });
    return NextResponse.json({
      message: 'Question removed from bookmarks successfully',
      favorite: result.data
    }, { status: 200 });

  } catch (error) {
    log.error('Error removing question bookmark', error as Error);
    return NextResponse.json(
      { error: 'Failed to remove question bookmark' },
      { status: 500 }
    );
  }
});
