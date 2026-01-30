import type { ApiRouteHandler, ApiHandlerContext } from '@/types/next';
import { NextRequest, NextResponse } from 'next/server';
import { withApiHandler } from '@/lib/app-access-control/interceptors';
type Complexity = 'easy' | 'medium' | 'hard' | 'expert';
export const GET: ApiRouteHandler = withApiHandler(async (request: NextRequest, { log, db }: ApiHandlerContext) => {
  const { searchParams } = new URL(request.url);
  const subjectSlug = searchParams.get('slug');
  const page = parseInt(searchParams.get('page') || '1', 10);
  const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);
  const complexity = searchParams.get('complexity');
  const gradeLevel = searchParams.get('gradeLevel');
  if (!subjectSlug) {
    return NextResponse.json(
      { error: 'Subject slug is required' },
      { status: 400 }
    );
  }
  const offset = (page - 1) * pageSize;
  try {
    // First get the subject
    const subjectResult = await db.query(
      'SELECT id, title, slug FROM subjects WHERE slug = $slug LIMIT 1',
      { slug: subjectSlug }
    );

    const subject = subjectResult[0];
    if (!subject) {
      return NextResponse.json(
        { error: 'Subject not found' },
        { status: 404 }
      );
    }
    // Build WHERE conditions
    const whereConditions = ['isActive = true'];
    const queryParams: any = { subjectId: subject.id };

    if (complexity && complexity.trim() !== '') {
      whereConditions.push('complexity = $complexity');
      queryParams.complexity = complexity;
    }
    if (gradeLevel && gradeLevel.trim() !== '') {
      whereConditions.push('gradeLevel = $gradeLevel');
      queryParams.gradeLevel = parseInt(gradeLevel);
    }

    // Get count - simplified approach
    const countQuery = `SELECT count() FROM questionsPublished WHERE ${whereConditions.join(' AND ')} AND questions.subjectId = $subjectId`;
    const countResult = await db.query(countQuery, queryParams);
    const total = countResult[0]?.count || 0;

    // Get questions - simplified without complex joins for now
    const questionsQuery = `SELECT * FROM questionsPublished WHERE ${whereConditions.join(' AND ')} ORDER BY createdAt DESC LIMIT $limit START $offset`;
    const questionsList = await db.query(questionsQuery, {
      ...queryParams,
      limit: pageSize,
      offset: offset
    });
    return NextResponse.json({
      subject,
      questions: questionsList,
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    }, {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch questions';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
});


