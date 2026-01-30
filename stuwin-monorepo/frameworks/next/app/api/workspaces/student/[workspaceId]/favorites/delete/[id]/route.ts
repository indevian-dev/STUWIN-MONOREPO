import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { withApiHandler } from '@/lib/app-access-control/interceptors';
import type { ApiRouteHandler, ApiHandlerContext } from '@/types/next';
import { accountBookmarks } from '@/lib/app-infrastructure/database/schema';
import { eq, and } from 'drizzle-orm';

export const DELETE: ApiRouteHandler = withApiHandler(async (request: NextRequest, { authData, params, log, db, isValidSlimId }: ApiHandlerContext) => {
  try {
    if (!authData) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const { id: questionId } = resolvedParams as { id: string };
    const accountId = authData.account.id;

    if (!questionId || !isValidSlimId || !isValidSlimId(questionId)) {
      return NextResponse.json(
        { error: 'Valid question ID is required' },
        { status: 400 }
      );
    }

    log.info('Removing question bookmark', { questionId, accountId });

    // Check if bookmark exists
    const existingBookmarks = await db
      .select()
      .from(accountBookmarks)
      .where(
        and(
          eq(accountBookmarks.questionId, questionId),
          eq(accountBookmarks.accountId, accountId)
        )
      )
      .limit(1);

    if (!existingBookmarks.length) {
      throw new Error('BOOKMARK_NOT_FOUND');
    }

    // Delete bookmark
    const [deleted] = await db
      .delete(accountBookmarks)
      .where(
        and(
          eq(accountBookmarks.questionId, questionId),
          eq(accountBookmarks.accountId, accountId)
        )
      )
      .returning();

    log.info('Question bookmark removed', { questionId });
    return NextResponse.json({
      message: 'Question removed from bookmarks successfully',
      favorite: deleted
    }, { status: 200 });

  } catch (error) {
    log.error('Error removing question bookmark', error instanceof Error ? error : new Error(String(error)));

    if (error instanceof Error && error.message === 'BOOKMARK_NOT_FOUND') {
      return NextResponse.json(
        { error: 'Favorite not found' },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to remove question bookmark' },
      { status: 500 }
    );
  }
});
