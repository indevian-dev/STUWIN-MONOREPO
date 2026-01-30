import type { NextRequest } from 'next/server';
import type { ApiRouteHandler, ApiHandlerContext } from '@/types/next';
import { NextResponse } from 'next/server';
import { withApiHandler } from '@/lib/app-access-control/interceptors';
import { studentQuizzes } from "@/lib/app-infrastructure/database/schema";
import { eq, and } from "drizzle-orm";

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
      { error: 'Valid quiz ID is required' },
      { status: 400 }
    );
  }

  const { id } = resolvedParams;

  if (!isValidSlimId || !isValidSlimId(id)) {
    return NextResponse.json(
      { error: 'Valid quiz ID is required' },
      { status: 400 }
    );
  }

  log.debug('Fetching quiz', { quizId: id });

  try {
    const accountId = authData.account.id;

    const quizResult = await db
      .select()
      .from(studentQuizzes)
      .where(
        and(
          eq(studentQuizzes.id, id),
          eq(studentQuizzes.studentAccountId, accountId)
        )
      )
      .limit(1);

    const quiz = quizResult[0];

    if (!quiz) {
      return NextResponse.json(
        { error: 'Quiz not found or access denied' },
        { status: 404 }
      );
    }

    log.info('Quiz fetched', { quizId: id });
    return NextResponse.json(
      { operation: 'success', quiz },
      { status: 200 }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch quiz';
    log.error('Error fetching quiz', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
});
