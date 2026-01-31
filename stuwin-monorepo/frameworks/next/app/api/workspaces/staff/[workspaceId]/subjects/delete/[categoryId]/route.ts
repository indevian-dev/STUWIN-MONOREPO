import { NextRequest, NextResponse } from 'next/server';
import { unifiedApiHandler } from '@/lib/app-access-control/interceptors';

export const DELETE = unifiedApiHandler(async (request: NextRequest, { module, params }) => {
  try {
    const { categoryId } = params || {};

    if (!categoryId) {
      return NextResponse.json(
        { error: 'Subject ID (categoryId) is required' },
        { status: 400 }
      );
    }

    const result = await module.learning.deleteSubject(categoryId);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete subject';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
});
