import { NextResponse } from 'next/server';
import { unifiedApiHandler } from '@/lib/app-access-control/interceptors';

export const GET = unifiedApiHandler(async (_request, { module, params, log, isValidSlimId }) => {
  const { id } = params as { id: string };

  if (!id || !isValidSlimId(id)) {
    return NextResponse.json(
      { error: 'Valid provider ID is required' },
      { status: 400 }
    );
  }

  log.debug('Fetching provider', { id });

  const result = await module.workspace.getWorkspace(id);

  if (!result) {
    return NextResponse.json(
      { error: 'Provider not found' },
      { status: 404 }
    );
  }

  log.info('Provider fetched', { id });
  return NextResponse.json(result, { status: 200 });
});
