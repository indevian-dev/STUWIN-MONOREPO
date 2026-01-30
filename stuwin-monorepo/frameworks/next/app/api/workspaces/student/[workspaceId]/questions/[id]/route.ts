import type { NextRequest } from 'next/server';
import type { ApiRouteHandler, ApiHandlerContext } from '@/types/next';
import { NextResponse } from 'next/server';
import { withApiHandler } from '@/lib/app-access-control/interceptors';
import { questions as questionsTable, learningSubjects } from '@/lib/app-infrastructure/database/schema';
import { eq, and } from 'drizzle-orm';

export const GET: ApiRouteHandler = withApiHandler(async (request: NextRequest, { authData, params, log, db, isValidSlimId }: ApiHandlerContext) => {
  if (!authData) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const resolvedParams = await params;
  if (!resolvedParams?.id) {
    return NextResponse.json(
      { error: 'Valid question ID is required' },
      { status: 400 }
    );
  }

  const { id } = resolvedParams;
  const accountId = authData.account.id;

  if (!isValidSlimId || !isValidSlimId(id)) {
    return NextResponse.json(
      { error: 'Valid question ID is required' },
      { status: 400 }
    );
  }

  log.debug('Fetching user question', { id, accountId });

  try {
    const questionResult = await db
      .select({
        question: questionsTable,
        subject: {
          title: learningSubjects.title,
          slug: learningSubjects.slug
        }
      })
      .from(questionsTable)
      .leftJoin(learningSubjects, eq(questionsTable.learningSubjectId, learningSubjects.id))
      .where(
        and(
          eq(questionsTable.id, id),
          eq(questionsTable.authorAccountId, accountId)
        )
      )
      .limit(1);

    if (!questionResult.length) {
      return NextResponse.json(
        { error: 'Question not found or access denied' },
        { status: 404 }
      );
    }

    const row = questionResult[0];
    const rawQuestion = row.question;

    // Transform the data structure
    const question = {
      id: rawQuestion.id,
      createdAt: rawQuestion.createdAt,
      updatedAt: rawQuestion.updatedAt,
      question: rawQuestion.question,
      answers: rawQuestion.answers,
      correctAnswer: rawQuestion.correctAnswer,
      authorAccountId: rawQuestion.authorAccountId,
      reviewerAccountId: rawQuestion.reviewerAccountId,
      subjectId: rawQuestion.learningSubjectId,
      complexity: rawQuestion.complexity,
      gradeLevel: Number(rawQuestion.gradeLevel),
      explanationGuide: rawQuestion.explanationGuide,
      language: rawQuestion.language,
      subjectTitle: row.subject?.title,
      subjectSlug: row.subject?.slug,
      publishedData: rawQuestion.isPublished ? {
        id: rawQuestion.id,
        question: rawQuestion.question,
        answers: rawQuestion.answers,
        correct_answer: rawQuestion.correctAnswer,
        complexity: rawQuestion.complexity,
        grade_level: Number(rawQuestion.gradeLevel),
        explanation_guide: rawQuestion.explanationGuide,
        is_active: rawQuestion.isPublished,
        created_at: rawQuestion.createdAt,
        updated_at: rawQuestion.updatedAt
      } : null
    };

    log.info('User question fetched', { id });
    return NextResponse.json({ question }, { status: 200 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch question';
    log.error('Error fetching question', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
});
