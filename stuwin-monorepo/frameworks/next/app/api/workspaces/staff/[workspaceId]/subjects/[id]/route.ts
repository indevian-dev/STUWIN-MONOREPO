import type { NextRequest } from 'next/server';
import type { ApiRouteHandler, ApiHandlerContext } from '@/types/next';
import { NextResponse } from 'next/server';
import { withApiHandler } from '@/lib/app-access-control/interceptors';
import { SUBJECTS } from '@/lib/app-infrastructure/database';
export const GET: ApiRouteHandler = withApiHandler(async (request: NextRequest, { authData, params, log, db }: ApiHandlerContext) => {
  try {
    if (!params) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }
    const { id: subjectId } = await params;
    if (!subjectId) {
      return NextResponse.json(
        { error: 'Subject ID is required' },
        { status: 400 }
      );
    }
    const subjectRecordId = subjectId.includes(':') ? subjectId : `${SUBJECTS}:${subjectId}`;
    const [subject] = await db.query(
      `SELECT * FROM ${SUBJECTS} WHERE id = $subjectId LIMIT 1`,
      { subjectId: subjectRecordId }
    );
    if (!subject) {
      return NextResponse.json(
        { error: 'Subject not found' },
        { status: 404 }
      );
    }
    return NextResponse.json({ subject });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch subject';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
});
