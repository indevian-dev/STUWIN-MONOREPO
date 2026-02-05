import { NextRequest, NextResponse } from 'next/server';
import { unifiedApiHandler } from '@/lib/app-access-control/interceptors';
import { ValidationService, Rules } from '@/lib/app-core-modules/services/ValidationService';

export const PUT = unifiedApiHandler(async (request: NextRequest, { module, params }) => {
  try {
    const { id: subjectId } = params || {};
    if (!subjectId) {
      return NextResponse.json({ error: 'Subject ID is required' }, { status: 400 });
    }

    const body = await request.json();

    const validation = ValidationService.validate(body, {
      title: {
        rules: [Rules.string('title'), Rules.subjectNameFormat('title')]
      },
      name: {
        rules: [Rules.string('name'), Rules.subjectNameFormat('name')]
      }
    });

    if (!validation.isValid) {
      return NextResponse.json({ error: validation.firstError?.message }, { status: 400 });
    }

    const result = await module.learning.updateSubject(subjectId, validation.sanitized);

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

    const validation = ValidationService.validate(body, {
      title: {
        rules: [Rules.string('title'), Rules.subjectNameFormat('title')]
      },
      name: {
        rules: [Rules.string('name'), Rules.subjectNameFormat('name')]
      }
    });

    if (!validation.isValid) {
      return NextResponse.json({ error: validation.firstError?.message }, { status: 400 });
    }

    const result = await module.learning.updateSubject(subjectId, validation.sanitized);

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
