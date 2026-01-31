import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { unifiedApiHandler, type UnifiedContext } from '@/lib/app-access-control/interceptors/ApiInterceptor';

// GET /api/workspaces/provider/topics - List all topics
export const GET = unifiedApiHandler(async (request: NextRequest, { module, log }: UnifiedContext) => {
  const { searchParams } = new URL(request.url);
  const subjectId = searchParams.get('subject_id') || searchParams.get('subjectId');
  const gradeLevel = searchParams.get('grade_level');
  const id = searchParams.get('id');

  // If ID is provided, get single topic
  if (id) {
    const result = await module.learning.getTopicById(id);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 404 });
    }
    return NextResponse.json({ topic: result.data }, { status: 200 });
  }

  // Build filters
  const filters: any = {};
  if (subjectId) filters.subjectId = subjectId;
  if (gradeLevel) filters.gradeLevel = parseInt(gradeLevel);

  const result = await module.learning.getTopics(filters);

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  log.info('Topics fetched', { count: result.data?.length });
  return NextResponse.json({
    topics: result.data
  }, { status: 200 });
});
