import { NextResponse } from 'next/server';
import { unifiedApiHandler } from '@/lib/middleware/handlers';

export const GET = unifiedApiHandler(async (_request, { module, params, authData, log, isValidSlimId }) => {
  const { id } = params as { id: string };

  if (!id || !isValidSlimId(id)) {
    return NextResponse.json(
      { error: 'Valid question ID is required' },
      { status: 400 }
    );
  }

  log.debug('Fetching user question', { id, accountId: authData.account.id });

  const result = await module.question.getById(id);

  if (!result.success || !result.data) {
    return NextResponse.json(
      { error: result.error || 'Question not found' },
      { status: 404 }
    );
  }

  // Check ownership
  if (result.data.authorAccountId !== authData.account.id) {
    return NextResponse.json(
      { error: 'Access denied' },
      { status: 403 }
    );
  }

  log.info('User question fetched', { id });

  return NextResponse.json({
    question: module.question.mapToLegacy(result.data)
  }, { status: 200 });
});
