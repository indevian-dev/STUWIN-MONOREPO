import type { NextRequest } from 'next/server';
import type { ApiRouteHandler, ApiHandlerContext } from '@/types/next';
import { NextResponse } from 'next/server';
import { withApiHandler } from '@/lib/app-access-control/interceptors';
import { accountBookmarks } from '@/lib/app-infrastructure/database/schema';
import { eq } from 'drizzle-orm';

// GET - Fetch all bookmarked question ids for current account
export const GET: ApiRouteHandler = withApiHandler(async (request: NextRequest, { authData, log, db }: ApiHandlerContext) => {
  try {
    if (!authData) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const accountId = authData.account.id;

    const bookmarksResult = await db
      .select({ questionId: accountBookmarks.questionId })
      .from(accountBookmarks)
      .where(eq(accountBookmarks.accountId, accountId));

    const questionIds = bookmarksResult.map((f: { questionId: string | null }) => String(f.questionId));

    log.info('Bookmarked questions fetched', { count: questionIds.length });

    return NextResponse.json({ bookmarks: questionIds }, { status: 200 });

  } catch (error) {
    log.error('Error retrieving bookmarked questions', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Failed to retrieve bookmarks'
    }, { status: 500 });
  }
});
