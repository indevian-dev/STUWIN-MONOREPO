
import { NextResponse } from 'next/server';
import { unifiedApiHandler } from '@/lib/app-access-control/interceptors';

export const GET = unifiedApiHandler(async (request, { module }) => {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1', 10);
  const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);

  const subjectIdParam = searchParams.get('subjectId');
  const subjectId = subjectIdParam ? parseInt(subjectIdParam, 10) : undefined;

  const complexity = searchParams.get('complexity') || undefined;
  const gradeLevelParam = searchParams.get('gradeLevel');
  const gradeLevel = gradeLevelParam ? parseInt(gradeLevelParam, 10) : undefined;

  // Safety check for ID types (since migration from string to number)
  if (subjectIdParam && isNaN(subjectId!)) {
    return NextResponse.json({
      questions: [],
      page,
      pageSize,
      total: 0,
      totalPages: 0
    }, { status: 200 });
  }

  const result = await module.learning.listQuestions({
    page,
    pageSize,
    subjectId,
    complexity,
    gradeLevel
  });

  if (!result.success || !(result as any).data) {
    return NextResponse.json({ error: (result as any).error || "Failed" }, { status: 500 });
  }

  const { questions, pagination } = (result as any).data;

  return NextResponse.json({
    questions,
    ...pagination
  });
});


