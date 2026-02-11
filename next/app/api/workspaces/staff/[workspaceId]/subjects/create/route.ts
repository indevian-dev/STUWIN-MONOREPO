import { NextRequest, NextResponse } from 'next/server';
import { unifiedApiHandler } from '@/lib/middleware/handlers';
import { SubjectCreateSchema } from '@/lib/domain/learning/learning.inputs';

export const POST = unifiedApiHandler(async (request: NextRequest, { module }) => {
  try {
    const body = await request.json();

    const parsed = SubjectCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || 'Validation failed' },
        { status: 400 }
      );
    }

    const { title, description, aiLabel, language, gradeLevel } = parsed.data;

    const result = await module.subject.create({
      title,
      description: description || '',
      language: language || 'az',
      gradeLevel: gradeLevel || 1,
      cover: body.cover,
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
