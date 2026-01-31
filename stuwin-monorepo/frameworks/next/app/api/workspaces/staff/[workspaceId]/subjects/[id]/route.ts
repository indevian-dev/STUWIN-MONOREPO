import { NextRequest, NextResponse } from 'next/server';
import { unifiedApiHandler } from '@/lib/app-access-control/interceptors';

export const GET = unifiedApiHandler(async (request: NextRequest, { module, params }) => {
  try {
    const { id: subjectId } = params || {};

    if (!subjectId) {
      return NextResponse.json(
        { error: 'Subject ID is required' },
        { status: 400 }
      );
    }

    const result = await module.learning.getSubjectById(subjectId);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 404 });
    }

    return NextResponse.json({ subject: result.data });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch subject';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
});
