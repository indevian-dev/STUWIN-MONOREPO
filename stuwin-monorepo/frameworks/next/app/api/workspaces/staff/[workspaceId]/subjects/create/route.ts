import { NextRequest, NextResponse } from 'next/server';
import { unifiedApiHandler } from '@/lib/app-access-control/interceptors';

export const POST = unifiedApiHandler(async (request: NextRequest, { module }) => {
  try {
    const body = await request.json();
    const { title, description, cover, aiLabel } = body;

    if (!title || !description) {
      return NextResponse.json(
        { error: 'Title and description are required' },
        { status: 400 }
      );
    }

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
