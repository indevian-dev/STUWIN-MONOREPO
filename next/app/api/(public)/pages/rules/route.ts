
import { unifiedApiHandler } from "@/lib/middleware/handlers";
import { okResponse, errorResponse } from '@/lib/middleware/responses/ApiResponse';

export const GET = unifiedApiHandler(async (request, { module }) => {
  const data = await module.content.contentRepo.findPageByType('RULES');

  if (!data) {
    return errorResponse('Rules not found', 404, "NOT_FOUND");
  }

  return okResponse(data);
});


