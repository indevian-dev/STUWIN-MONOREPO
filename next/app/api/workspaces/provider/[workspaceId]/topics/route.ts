import type { NextRequest } from 'next/server';
import { unifiedApiHandler, type UnifiedContext } from '@/lib/middleware/handlers/ApiInterceptor';
import { okResponse, errorResponse, serverErrorResponse } from '@/lib/middleware/responses/ApiResponse';

// GET /api/workspaces/provider/topics - List all topics
export const GET = unifiedApiHandler(async (request: NextRequest, { module, log }: UnifiedContext) => {
  const { searchParams } = new URL(request.url);
  const subjectId = searchParams.get('subject_id') || searchParams.get('subjectId');
  const gradeLevel = searchParams.get('grade_level');
  const id = searchParams.get('id');

  // If ID is provided, get single topic
  if (id) {
    const result = await module.topic.getById(id);
    if (!result.success) {
      return errorResponse(result.error, 404);
    }
    return okResponse(result.data);
  }

  // Build filters
  const filters: any = {};
  if (subjectId) filters.subjectId = subjectId;
  if (gradeLevel) filters.gradeLevel = parseInt(gradeLevel);

  const result = await module.topic.list(filters);

  if (!result.success) {
    return serverErrorResponse(result.error);
  }

  log.info('Topics fetched', { count: result.data?.length });
  return okResponse(result.data);
});
