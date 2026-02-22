
import { unifiedApiHandler } from "@/lib/middleware/_Middleware.index";
import { okResponse, errorResponse } from '@/lib/middleware/Response.Api.middleware';

export const GET = unifiedApiHandler(async (request, { module, params }) => {
  const { id } = await params;
  if (!id) {
    return errorResponse("Invalid Subject ID", 400);
  }

  const result = await module.topic.list({ subjectId: id });

  if (!result.success) {
    return errorResponse(result.error || "Failed to fetch topics", 500);
  }

  return okResponse(result.data);
});
