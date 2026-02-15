
import { unifiedApiHandler } from '@/lib/middleware/handlers';
import { okResponse, serverErrorResponse } from '@/lib/middleware/responses/ApiResponse';

export const GET = unifiedApiHandler(async (request, { module }) => {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1', 10);
  const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);

  const subjectIdParam = searchParams.get('subjectId');
  const subjectId = subjectIdParam || undefined;

  const complexity = searchParams.get('complexity') || undefined;
  const gradeLevelParam = searchParams.get('gradeLevel');
  const gradeLevel = gradeLevelParam ? parseInt(gradeLevelParam, 10) : undefined;


  const result = await module.question.list({
    page,
    pageSize,
    subjectId,
    complexity,
    gradeLevel
  });

  if (!result.success || !(result as any).data) {
    return serverErrorResponse((result as any).error || "Failed");
  }

  const { questions, pagination } = (result as any).data;

  return okResponse({ questions, ...pagination });
});


