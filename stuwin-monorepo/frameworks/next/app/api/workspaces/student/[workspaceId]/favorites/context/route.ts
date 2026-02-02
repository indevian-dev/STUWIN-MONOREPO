import { NextResponse } from 'next/server';
import { unifiedApiHandler } from '@/lib/app-access-control/interceptors';

export const GET = unifiedApiHandler(async (request, { module, authData, params, log }) => {
  try {
    const accountId = authData.account.id;
    const { workspaceId } = params as { workspaceId: string };
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10) || 1;
    const limit = parseInt(searchParams.get('limit') || '20', 10) || 20;

    log.debug('Fetching bookmarked questions context', { accountId, page, limit });

    const result = await module.support.getBookmarksContext(accountId, workspaceId, page, limit);

    if (!result.success || !result.data) {
      return NextResponse.json({ error: result.error || 'Failed to retrieve favorites' }, { status: 500 });
    }

    const favorites = result.data.bookmarks.map((row: any) => ({
      favoriteId: row.bookmark.id,
      id: row.question?.id,
      questionId: row.question?.id,
      subjectId: row.question?.providerSubjectId ?? null,
      language: row.question?.language ?? null,
      complexity: row.question?.complexity ?? null,
      gradeLevel: row.question?.gradeLevel ? Number(row.question.gradeLevel) : null,
      createdAt: row.bookmark.createdAt,
    }));

    log.info('Bookmarked questions context fetched', {
      count: favorites.length,
      total: result.data.pagination.total
    });

    return NextResponse.json({
      message: 'Bookmarks retrieved successfully',
      favorites,
      pagination: {
        ...result.data.pagination,
        hasNext: page < result.data.pagination.totalPages,
        hasPrev: page > 1
      }
    }, { status: 200 });

  } catch (error) {
    log.error('Error retrieving favorite questions', error as Error);
    return NextResponse.json(
      { error: 'Failed to retrieve favorites' },
      { status: 500 }
    );
  }
});
