import type { NextRequest } from 'next/server';
import type { ApiRouteHandler, ApiHandlerContext } from '@/types/next';
import { NextResponse } from 'next/server';
import { withApiHandler } from '@/lib/app-access-control/interceptors';
import { questions as questionsTable, learningSubjects } from '@/lib/app-infrastructure/database/schema';
import { eq, and, desc, sql } from 'drizzle-orm';

export const GET: ApiRouteHandler = withApiHandler(async (request: NextRequest, { authData, log, db }: ApiHandlerContext) => {
  if (!authData) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const accountId = authData.account.id;
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1', 10);
  const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);
  const offset = (page - 1) * pageSize;

  log.debug('Fetching user questions', { accountId, page, pageSize });

  try {
    const whereClause = eq(questionsTable.authorAccountId, accountId);

    // Get count
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(questionsTable)
      .where(whereClause);

    const total = Number(countResult[0]?.count || 0);

    // Get questions with related data
    const questionsResult = await db
      .select({
        question: questionsTable,
        subject: {
          title: learningSubjects.title,
          slug: learningSubjects.slug
        }
      })
      .from(questionsTable)
      .leftJoin(learningSubjects, eq(questionsTable.learningSubjectId, learningSubjects.id))
      .where(whereClause)
      .orderBy(desc(questionsTable.createdAt))
      .limit(pageSize)
      .offset(offset);

    // Transform the results to match expected format
    const questionsList = questionsResult.map((row: any) => ({
      id: row.question.id,
      question: row.question.question,
      answers: row.question.answers,
      correctAnswer: row.question.correctAnswer,
      subjectId: row.question.learningSubjectId,
      complexity: row.question.complexity,
      gradeLevel: row.question.gradeLevel,
      explanationGuide: row.question.explanationGuide,
      createdAt: row.question.createdAt,
      subjectTitle: row.subject?.title,
      subjectSlug: row.subject?.slug,
      publishedData: row.question.isPublished ? {
        id: row.question.id,
        is_active: row.question.isPublished,
        created_at: row.question.createdAt,
        updated_at: row.question.updatedAt,
      } : null,
    }));

    log.info('User questions fetched', { count: questionsList.length, total });
    return NextResponse.json({
      questions: questionsList,
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize)
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch questions';
    log.error('Error fetching user questions', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
});
