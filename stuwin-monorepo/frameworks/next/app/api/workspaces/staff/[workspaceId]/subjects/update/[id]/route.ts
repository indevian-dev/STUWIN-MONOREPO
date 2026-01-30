import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { withApiHandler } from '@/lib/app-access-control/interceptors';
import { SUBJECTS } from '@/lib/app-infrastructure/database';
import slugify from 'slugify';
import type { ApiRouteHandler, ApiHandlerContext } from '@/types/next';
export const PUT: ApiRouteHandler = withApiHandler(async (request: NextRequest, { authData, params, log, db }: ApiHandlerContext) => {
  if (!authData) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const resolvedParams = await params;
  const subjectId = (resolvedParams as Record<string, string>)?.id;
  const accountId = authData.account.id;
  if (!subjectId) {
    return NextResponse.json(
      { error: 'Subject ID is required' },
      { status: 400 }
    );
  }
  const subjectRecordId = subjectId.includes(':') ? subjectId : `${SUBJECTS}:${subjectId}`;
  try {
    const body = await request.json();
    const { title, description, is_active, cover, aiLabel } = body;
    if (title === undefined &&
      description === undefined &&
      is_active === undefined &&
      cover === undefined &&
      aiLabel === undefined) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }
    const [existingSubject] = await db.query(
      `SELECT id FROM ${SUBJECTS} WHERE id = $subjectId LIMIT 1`,
      { subjectId: subjectRecordId }
    );
    if (!existingSubject) {
      throw new Error('SUBJECT_NOT_FOUND');
    }

    const updateData: Record<string, unknown> = {};
    if (title !== undefined) {
      updateData.title = title;
      updateData.slug = slugify(title, { lower: true, strict: true });
    }
    if (description !== undefined) {
      updateData.description = description;
    }
    if (is_active !== undefined) {
      updateData.isActive = is_active;
    }
    if (cover !== undefined) {
      updateData.cover = cover;
    }
    if (aiLabel !== undefined) {
      updateData.aiLabel = aiLabel;
    }

    const updated = await db.query(
      'UPDATE $record SET $data RETURN AFTER',
      { record: subjectRecordId, data: updateData }
    );
    const subject = updated[0];
    return NextResponse.json({ subject }, { status: 200 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to update subject';
    if (errorMessage === 'SUBJECT_NOT_FOUND') {
      return NextResponse.json(
        { error: 'Subject not found' },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to update subject' },
      { status: 500 }
    );
  }
});
export const PATCH: ApiRouteHandler = withApiHandler(async (request: NextRequest, { authData, params, log, db }: ApiHandlerContext) => {
  if (!authData) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const resolvedParams = await params;
  const subjectId = (resolvedParams as Record<string, string>)?.id;
  const accountId = authData.account.id;
  if (!subjectId) {
    return NextResponse.json(
      { error: 'Subject ID is required' },
      { status: 400 }
    );
  }
  const subjectRecordId = subjectId.includes(':') ? subjectId : `${SUBJECTS}:${subjectId}`;
  try {
    const body = await request.json();
    const { is_active } = body;
    if (is_active === undefined) {
      return NextResponse.json(
        { error: 'is_active field is required for PATCH' },
        { status: 400 }
      );
    }
    const [existingSubject] = await db.query(
      `SELECT id FROM ${SUBJECTS} WHERE id = $subjectId LIMIT 1`,
      { subjectId: subjectRecordId }
    );
    if (!existingSubject) {
      throw new Error('SUBJECT_NOT_FOUND');
    }

    const updated = await db.query(
      'UPDATE $record SET isActive = $isActive RETURN AFTER',
      { record: subjectRecordId, isActive: is_active }
    );
    const subject = updated[0];
    return NextResponse.json({ subject }, { status: 200 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to update subject status';
    if (errorMessage === 'SUBJECT_NOT_FOUND') {
      return NextResponse.json(
        { error: 'Subject not found' },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to update subject status' },
      { status: 500 }
    );
  }
});
