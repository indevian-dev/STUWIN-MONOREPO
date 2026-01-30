import type { NextRequest } from 'next/server';
import type { ApiRouteHandler, ApiHandlerContext } from '@/types/next';
import { NextResponse } from 'next/server';
import { withApiHandler } from '@/lib/app-access-control/interceptors';
import logger from '@/lib/app-infrastructure/loggers/Logger';


// GET /api/workspaces/provider/topics - List all topics
export const GET: ApiRouteHandler = withApiHandler(async (request: NextRequest, { authData, log, db, isValidSlimId }: ApiHandlerContext) => {
  const { searchParams } = new URL(request.url);
  const subjectId = searchParams.get('subject_id') || searchParams.get('subjectId');
  const gradeLevel = searchParams.get('grade_level');
  const id = searchParams.get('id');

  // If ID is provided, get single topic
  if (id) {
    if (!isValidSlimId(id)) {
      return NextResponse.json({
        error: 'Invalid ID format'
      }, { status: 400 });
    }
    const topicResult = await db.query(
      'SELECT * FROM topics WHERE id = $id LIMIT 1',
      { id }
    );

    const topic = topicResult[0];
    if (!topic) {
      return NextResponse.json({
        error: 'Topic not found'
      }, { status: 404 });
    }
    return NextResponse.json({
      topic
    }, { status: 200 });
  }

  // Build query with filters
  const whereConditions = [];

  // Apply subject filter
  if (subjectId && subjectId.trim()) {
    const trimmedSubjectId = subjectId.trim();
    if (isValidSlimId(trimmedSubjectId)) {
      whereConditions.push('subjectId = $subjectId');
    }
  }

  // Apply grade level filter
  if (gradeLevel && gradeLevel.trim()) {
    const parsedGradeLevel = parseInt(gradeLevel);
    if (!isNaN(parsedGradeLevel)) {
      whereConditions.push('gradeLevel = $gradeLevel');
    }
  }

  // Execute query with combined conditions
  const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
  const queryParams: any = {};

  if (subjectId && isValidSlimId(subjectId.trim())) {
    queryParams.subjectId = subjectId.trim();
  }
  if (gradeLevel && !isNaN(parseInt(gradeLevel))) {
    queryParams.gradeLevel = parseInt(gradeLevel);
  }

  const data = await db.query(`SELECT * FROM topics ${whereClause}`, queryParams);

  log.info('Topics fetched', { count: data?.length });
  return NextResponse.json({
    topics: data
  }, { status: 200 });
});
