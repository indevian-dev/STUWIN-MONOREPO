import { NextRequest, NextResponse } from 'next/server';
import { unifiedApiHandler } from '@/lib/app-access-control/interceptors';
import { ValidationService, Rules } from '@/lib/app-core-modules/services/ValidationService';

export const POST = unifiedApiHandler(async (request: NextRequest, { module }) => {
  try {
    const body = await request.json();

    const validation = ValidationService.validate(body, {
      title: {
        rules: [Rules.required('title'), Rules.string('title'), Rules.subjectNameFormat('title')]
      },
      description: {
        rules: [Rules.required('description'), Rules.string('description')]
      }
    });

    if (!validation.isValid) {
      return NextResponse.json(
        { error: validation.firstError?.message || 'Validation failed' },
        { status: 400 }
      );
    }

    const { title, description, cover, aiLabel } = validation.sanitized;

    const result = await module.learning.createSubject({
      title,
      description,
      cover,
      aiLabel,
      isGlobal: true,
      organizationId: 'org_platform'
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ subject: result.data }, { status: 201 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to create subject';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
});
