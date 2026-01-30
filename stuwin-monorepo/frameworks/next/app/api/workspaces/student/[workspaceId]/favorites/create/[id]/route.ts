import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { withApiHandler } from '@/lib/app-access-control/interceptors';
import type { ApiRouteHandler, ApiHandlerContext } from '@/types/next';
import { accountBookmarks, questions as questionsTable } from '@/lib/app-infrastructure/database/schema';
import { eq, and } from 'drizzle-orm';

export const POST: ApiRouteHandler = withApiHandler(async (request: NextRequest, { authData, params, log, db, isValidSlimId, generateSlimId }: ApiHandlerContext) => {
  try {
    if (!authData?.account?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
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

    log.info('Adding question bookmark', { questionId, accountId });

    // Check if question exists and is published
    const questionResult = await db
      .select()
      .from(questionsTable)
      .where(eq(questionsTable.id, questionId))
      .limit(1);

    if (!questionResult.length) {
      throw new Error('QUESTION_NOT_FOUND');
    }

    const questionPub = questionResult[0];
    if (!questionPub.isPublished) {
      throw new Error('QUESTION_NOT_ACTIVE'); // Mapping to previous error name
    }

    // Check if already bookmarked
    const existingResult = await db
      .select()
      .from(accountBookmarks)
      .where(
        and(
          eq(accountBookmarks.questionId, questionId),
          eq(accountBookmarks.accountId, accountId)
        )
      )
      .limit(1);

    if (existingResult.length > 0) {
      throw new Error('ALREADY_BOOKMARKED');
    }

    // Create bookmark
    const [favorite] = await db
      .insert(accountBookmarks)
      .values({
        id: generateSlimId ? generateSlimId() : undefined,
        questionId: questionId,
        accountId: accountId,
        workspaceId: authData.account.workspaceId || ""
      })
      .returning();

    log.info('Question bookmarked', {
      questionId,
      favoriteId: favorite.id
    });

    return NextResponse.json({
      message: 'Question bookmarked successfully',
      favorite: favorite,
      questionPublished: questionPub
    }, { status: 201 });

  } catch (error) {
    log.error('Error bookmarking question', error as Error);

    if (error instanceof Error && error.message === 'QUESTION_NOT_FOUND') {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      );
    }
    if (error instanceof Error && error.message === 'ALREADY_BOOKMARKED') {
      return NextResponse.json(
        { error: 'Question is already bookmarked' },
        { status: 409 }
      );
    }
    if (error instanceof Error && error.message === 'QUESTION_NOT_ACTIVE') {
      return NextResponse.json(
        { error: 'Question is not active' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to bookmark question' },
      { status: 500 }
    );
  }
});
