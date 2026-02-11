
import { NextResponse } from 'next/server';
import { unifiedApiHandler } from '@/lib/middleware/handlers';

export const GET = unifiedApiHandler(async (request, { module }) => {
  try {
    const result = await module.subject.getPublicSubjects();

    if (!result.success || !(result as any).data) { // Service returns { success, data }
      throw new Error((result as any).error || "Failed to fetch subjects");
    }

    return NextResponse.json({ subjects: (result as any).data });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch subjects' },
      { status: 500 }
    );
  }
});


