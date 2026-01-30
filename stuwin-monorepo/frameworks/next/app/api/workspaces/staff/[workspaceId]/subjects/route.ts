import type { NextRequest } from 'next/server';
import type { ApiRouteHandler, ApiHandlerContext } from '@/types/next';
import { NextResponse } from 'next/server';
import { withApiHandler } from '@/lib/app-access-control/interceptors';
export const GET: ApiRouteHandler = withApiHandler(async (request: NextRequest, { authData, log, db }: ApiHandlerContext) => {
  const { searchParams } = new URL(request.url);
  const parentId = searchParams.get('parent_id');
  try {
    const data = await db.query('SELECT * FROM subjects');
    return NextResponse.json({ subjects: data }, { status: 200 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch subjects';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
});
