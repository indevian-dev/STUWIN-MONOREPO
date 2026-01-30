import type { NextRequest } from 'next/server';
import type { ApiRouteHandler, ApiHandlerContext } from '@/types/next';
import { NextResponse } from 'next/server';
import { withApiHandler } from '@/lib/app-access-control/interceptors';
import { accountBookmarks, questions as questionsTable } from '@/lib/app-infrastructure/database/schema';
import { eq, and, desc, sql } from 'drizzle-orm';

export const GET: ApiRouteHandler = withApiHandler(async (request: NextRequest, { authData, log, db }: ApiHandlerContext) => {
  try {
    if (!authData?.account?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const accountId = authData.account.id;
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1') || 1;
    const limit = parseInt(url.searchParams.get('limit') || '20') || 20;
    const offset = (page - 1) * limit;

    log.debug('Fetching bookmarked questions context', {
      accountId,
      page,
      limit
    });

    const whereClause = eq(accountBookmarks.accountId, accountId);

    const bookmarksResult = await db
      .select({
        bookmark: accountBookmarks,
        question: questionsTable
      })
      .from(accountBookmarks)
      .leftJoin(questionsTable, eq(accountBookmarks.questionId, questionsTable.id))
      .where(whereClause)
      .orderBy(desc(accountBookmarks.createdAt))
      .limit(limit)
      .offset(offset);

    const favorites = bookmarksResult.map((row: { bookmark: any; question: any }) => ({
      favoriteId: row.bookmark.id,
      id: row.question?.id,
      questionId: row.question?.id,
      subjectId: row.question?.learningSubjectId ?? null,
      language: row.question?.language ?? null,
      complexity: row.question?.complexity ?? null,
      gradeLevel: row.question?.gradeLevel ? Number(row.question.gradeLevel) : null,
      createdAt: row.bookmark.createdAt,
    }));

    const countResult = await db
      .select({ total: sql<number>`count(*)` })
      .from(accountBookmarks)
      .where(whereClause);

    const total = Number(countResult[0]?.total || 0);
    const totalPages = Math.ceil(total / limit);

    log.info('Bookmarked questions context fetched', {
      count: favorites.length,
      total
    });

    return NextResponse.json({
      message: 'Bookmarks retrieved successfully',
      favorites,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    }, { status: 200 });

  } catch (error) {
    log.error('Error retrieving favorite questions', error as Error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to retrieve favorites' },
      { status: 500 }
    );
  }
});
