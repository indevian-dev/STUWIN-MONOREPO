import { unifiedApiHandler } from '@/lib/middleware/_Middleware.index';

import { okResponse, serverErrorResponse } from '@/lib/middleware/Response.Api.middleware';
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
    return serverErrorResponse("Failed to fetch organizations");
  }

  return okResponse(result.data);
});
