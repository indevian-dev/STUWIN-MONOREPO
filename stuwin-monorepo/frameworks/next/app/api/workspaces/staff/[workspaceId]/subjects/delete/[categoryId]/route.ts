import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { withApiHandler } from '@/lib/app-access-control/interceptors';
import type { ApiRouteHandler, ApiHandlerContext } from '@/types/next';
export const DELETE: ApiRouteHandler = withApiHandler(async (request: NextRequest, { authData, params, log, db, isValidSlimId }: ApiHandlerContext) => {
  if (!authData) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const resolvedParams = await params;
  const subjectId = (resolvedParams as Record<string, string>)?.categoryId;
  const accountId = authData.account.id;
  if (!subjectId || !isValidSlimId(subjectId)) {
    return NextResponse.json(
      { error: 'Valid subject ID is required' },
      { status: 400 }
    );
  }
  try {
    // Check if subject exists
    const subjectsResult = await db.query(
      'SELECT * FROM subjects WHERE id = $subjectId LIMIT 1',
      { subjectId }
    );

    if (!subjectsResult.length) {
      throw new Error('SUBJECT_NOT_FOUND');
    }

    const subject = subjectsResult[0];

    // Check if subject is used in questions
    const questionsCountResult = await db.query(
      'SELECT count() FROM questions WHERE subjectId = $subjectId',
      { subjectId }
    );

    const questionsCount = questionsCountResult[0]?.count || 0;
    if (questionsCount > 0) {
      throw new Error('SUBJECT_IN_USE');
    }

    // Delete the subject
    const deleteResult = await db.query(
      'DELETE FROM subjects WHERE id = $subjectId RETURN BEFORE',
      { subjectId }
    );

    const deletedSubject = deleteResult[0];
    return NextResponse.json({
      success: true,
      message: 'Subject deleted successfully',
      subject: deletedSubject
    }, { status: 200 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete subject';
    if (errorMessage === 'SUBJECT_NOT_FOUND') {
      return NextResponse.json(
        { error: 'Subject not found' },
        { status: 404 }
      );
    }
    if (errorMessage === 'SUBJECT_HAS_CHILDREN') {
      return NextResponse.json(
        { error: 'Cannot delete subject with children' },
        { status: 400 }
      );
    }
    if (errorMessage === 'SUBJECT_IN_USE') {
      return NextResponse.json(
        { error: 'Cannot delete subject used by questions' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to delete subject' },
      { status: 500 }
    );
  }
});
