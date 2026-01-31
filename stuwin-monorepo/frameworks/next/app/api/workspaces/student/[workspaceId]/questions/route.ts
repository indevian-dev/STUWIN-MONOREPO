import { NextResponse } from 'next/server';
import { unifiedApiHandler } from '@/lib/app-access-control/interceptors';

export const GET = unifiedApiHandler(async (request, { module, authData, log }) => {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1', 10);
  const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);

  log.debug('Fetching user questions', { accountId: authData.account.id, page, pageSize });

  const result = await module.learning.listQuestions({
    page,
    pageSize,
    authorAccountId: authData.account.id
  });

  if (!result.success) {
    return NextResponse.json(
      { error: result.error || 'Failed to fetch questions' },
      { status: 500 }
    );
  }

  log.info('User questions fetched', {
    count: result.data?.questions.length,
    total: result.data?.pagination.total
  });

  return NextResponse.json({
    questions: result.data?.questions.map(q => module.learning.mapQuestionToLegacy(q)),
    ...result.data?.pagination
  });
});
