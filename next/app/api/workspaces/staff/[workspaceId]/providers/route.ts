import { NextResponse } from 'next/server';
import { unifiedApiHandler } from '@/lib/middleware/handlers';

export const GET = unifiedApiHandler(async (request, { module }) => {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const pageSize = parseInt(searchParams.get('pageSize') || '10');
  const search = searchParams.get('search') || undefined;
  const searchType = searchParams.get('searchType') || 'title';

  const result = await module.provider.list({
    offset: (page - 1) * pageSize,
    limit: pageSize,
    search,
  });

  if (!result.data) {
    return NextResponse.json({ error: 'Failed to fetch organizations' }, { status: 500 });
  }

  return NextResponse.json(result.data, { status: 200 });
});
