import type { NextRequest } from 'next/server';
import type { ApiRouteHandler, ApiHandlerContext } from '@/types/next';
import { NextResponse } from 'next/server';
import { withApiHandler } from '@/lib/app-access-control/interceptors';
import { PAGES } from '@/lib/app-infrastructure/database';
export const GET: ApiRouteHandler = withApiHandler(async (request: NextRequest, { authData, log, db }: ApiHandlerContext) => {
  try {
    if (!authData) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const accountId = authData.account.id;
    if (!type) {
      return NextResponse.json({ error: 'Type parameter is required' }, { status: 400 });
    }
    const [page] = await db.query(
      `SELECT * FROM ${PAGES} WHERE type = $type LIMIT 1`,
      { type }
    );
    if (!page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }
    // TODO: Implement audit logging
    // await db.insert(actionLogs).values({
    //   action: 'fetch_page',
    //   createdBy: accountId,
    //   resourceType: 'pages',
    //   resourceId: page.id,
    // });
    return NextResponse.json({ doc: page, success: true });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch page';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
});
