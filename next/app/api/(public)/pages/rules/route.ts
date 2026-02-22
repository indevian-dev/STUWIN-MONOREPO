
import { unifiedApiHandler } from "@/lib/middleware/_Middleware.index";
import { okResponse, errorResponse } from '@/lib/middleware/Response.Api.middleware';

export const GET = unifiedApiHandler(async (request, { module }) => {
  const data = await module.content.contentRepo.findPageByType('RULES');

  if (!data) {
    return errorResponse('Rules not found', 404, "NOT_FOUND");
  }

  return okResponse(data);
});


