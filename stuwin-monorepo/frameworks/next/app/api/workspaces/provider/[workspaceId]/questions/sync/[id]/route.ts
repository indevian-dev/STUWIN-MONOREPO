import type { NextRequest } from 'next/server';
import type { ApiRouteHandler, ApiHandlerContext } from '@/types/next';
import { NextResponse } from 'next/server';
import { withApiHandler } from '@/lib/app-access-control/interceptors';
import { QUESTIONS } from '@/lib/app-infrastructure/database';

const QUESTIONS_PUBLISHED_TABLE = 'questionsPublished';
const NOTIFICATIONS_TABLE = 'accountsNotifications';
export const POST: ApiRouteHandler = withApiHandler(async (request: NextRequest, { authData, params, log, db }: ApiHandlerContext) => {
  if (!authData) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const resolvedParams = await params;
  const id = (resolvedParams as Record<string, string>)?.id;
  const accountId = authData.account.id;
  if (!id) {
    return NextResponse.json({ error: 'Question ID is required' }, { status: 400 });
  }
  try {
    const extractIdPart = (value: unknown): string => {
      if (value === null || value === undefined) {
        return '';
      }
      const raw = String(value);
      return raw.includes(':') ? (raw.split(':').pop() || '') : raw;
    };

    const questionRecordId = id.includes(':') ? id : `${QUESTIONS}:${id}`;
    const [question] = await db.query(
      `SELECT * FROM ${QUESTIONS} WHERE id = $questionId LIMIT 1`,
      { questionId: questionRecordId }
    );

    if (!question) {
      throw new Error('QUESTION_NOT_FOUND');
    }

    await db.query(
      'UPDATE $record SET reviewerAccountId = $reviewerAccountId, updatedAt = $updatedAt',
      { record: questionRecordId, reviewerAccountId: accountId, updatedAt: new Date() }
    );

    const questionIdPart = extractIdPart(question.id);
    const questionIdNumeric = Number(questionIdPart);

    const [existingPublished] = Number.isNaN(questionIdNumeric)
      ? []
      : await db.query(
        `SELECT id FROM ${QUESTIONS_PUBLISHED_TABLE} WHERE questionId = $questionId LIMIT 1`,
        { questionId: questionIdNumeric }
      );

    let publishedQuestion: any;

    if (existingPublished) {
      const updatedPublished = await db.query(
        `UPDATE ${QUESTIONS_PUBLISHED_TABLE} SET question = $question, answers = $answers, correctAnswer = $correctAnswer, complexity = $complexity, gradeLevel = $gradeLevel, explanationGuide = $explanationGuide, topic = $topic, language = $language, isActive = true, updatedAt = $updatedAt WHERE questionId = $questionId RETURN AFTER`,
        {
          questionId: questionIdNumeric,
          question: question.question,
          answers: question.answers,
          correctAnswer: question.correctAnswer,
          complexity: question.complexity,
          gradeLevel: question.gradeLevel,
          explanationGuide: question.explanationGuide,
          topic: question.topic,
          language: question.language,
          updatedAt: new Date(),
        }
      );
      publishedQuestion = updatedPublished[0];
    } else {
      const createdPublished = await db.query(
        `CREATE ${QUESTIONS_PUBLISHED_TABLE} CONTENT $data`,
        {
          data: {
            questionId: questionIdNumeric,
            question: question.question,
            answers: question.answers,
            correctAnswer: question.correctAnswer,
            complexity: question.complexity,
            gradeLevel: question.gradeLevel,
            explanationGuide: question.explanationGuide,
            topic: question.topic,
            language: question.language,
            authorAccountId: question.authorAccountId,
            reviewerAccountId: accountId,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          }
        }
      );
      publishedQuestion = createdPublished[0];

      if (question.authorAccountId) {
        await db.query(`CREATE ${NOTIFICATIONS_TABLE} CONTENT $data`, {
          data: {
            name: 'Question Approved',
            body: 'Your question has been approved and published',
            markAsRead: false,
            accountId: question.authorAccountId,
            createdAt: new Date(),
          }
        });
      }
    }

    const result = {
      question: publishedQuestion,
      wasPublished: !existingPublished
    };
    return NextResponse.json({
      success: true,
      message: result.wasPublished
        ? 'Question published successfully'
        : 'Question updated in library',
      data: result.question
    }, { status: 200 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to publish question';
    if (errorMessage === 'QUESTION_NOT_FOUND') {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
});
