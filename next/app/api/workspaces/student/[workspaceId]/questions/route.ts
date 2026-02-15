import { unifiedApiHandler } from '@/lib/middleware/handlers';
import { okResponse, serverErrorResponse } from '@/lib/middleware/responses/ApiResponse';

export const GET = unifiedApiHandler(async (request, { module, authData, log }) => {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1', 10);
  const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);

  log.debug('Fetching user questions', { accountId: authData.account.id, page, pageSize });

  const result = await module.question.list({
    page,
    pageSize,
    authorAccountId: authData.account.id
  });

  if (!result.success) {
    return serverErrorResponse(result.error || 'Failed to fetch questions');
  }

  log.info('User questions fetched', {
    count: result.data?.questions.length,
    total: result.data?.pagination.total
  });

  return okResponse({ questions: result.data?.questions.map(q => module.question.mapToLegacy(q)), ...result.data?.pagination });
});
