import { NextResponse } from 'next/server';
import { unifiedApiHandler } from '@/lib/app-access-control/interceptors';

export const GET = unifiedApiHandler(async (_request, { module, authData, params, log }) => {
  try {
    const accountId = authData.account.id;
    const { workspaceId } = params as { workspaceId: string };

    const result = await module.support.listBookmarks(accountId, workspaceId);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    const questionIds = (result.data || []).map((f: any) => String(f.questionId));

    log.info('Bookmarked questions fetched', { count: questionIds.length });

    return NextResponse.json({ bookmarks: questionIds }, { status: 200 });
  } catch (error) {
    log.error('Error retrieving bookmarked questions', error as Error);
    return NextResponse.json(
      { error: 'Failed to retrieve bookmarks' },
      { status: 500 }
    );
  }
});
