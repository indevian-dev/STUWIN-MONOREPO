import { NextRequest, NextResponse } from 'next/server';
import { unifiedApiHandler } from '@/lib/middleware/handlers';
import { SubjectUpdateSchema } from '@/lib/domain/learning/learning.inputs';

export const PUT = unifiedApiHandler(async (request: NextRequest, { module, params }) => {
  try {
    const { id: subjectId } = params || {};
    if (!subjectId) {
      return NextResponse.json({ error: 'Subject ID is required' }, { status: 400 });
    }

    const body = await request.json();

    const parsed = SubjectUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0]?.message || 'Validation failed' }, { status: 400 });
    }

    const result = await module.subject.update(subjectId, parsed.data);

    if (!result.success) {
      const status = result.error === 'Subject not found' ? 404 : 400;
      return NextResponse.json({ error: result.error }, { status });
    }

    return NextResponse.json({ subject: result.data }, { status: 200 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to update subject';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
});

export const PATCH = unifiedApiHandler(async (request: NextRequest, { module, params }) => {
  try {
    const { id: subjectId } = params || {};
    if (!subjectId) {
      return NextResponse.json({ error: 'Subject ID is required' }, { status: 400 });
    }

    const body = await request.json();

    const parsed = SubjectUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0]?.message || 'Validation failed' }, { status: 400 });
    }

    const result = await module.subject.update(subjectId, parsed.data);

    if (!result.success) {
      const status = result.error === 'Subject not found' ? 404 : 400;
      return NextResponse.json({ error: result.error }, { status });
    }

    return NextResponse.json({ subject: result.data }, { status: 200 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to update subject status';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
});
