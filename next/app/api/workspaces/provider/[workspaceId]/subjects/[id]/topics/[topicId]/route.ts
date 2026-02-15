
import { unifiedApiHandler } from "@/lib/middleware/handlers";
import { okResponse, errorResponse } from '@/lib/middleware/responses/ApiResponse';

export const GET = unifiedApiHandler(async (request, { module, params }) => {
  const { id, topicId } = await params;

  if (!id || !topicId) {
    return errorResponse("Invalid subject ID or topic ID", 400);
  }

  const result = await module.topic.getDetail(topicId, id);

  if (!result.success) {
    return errorResponse(result.error || "Failed to fetch topic", result.error === "Topic not found" ? 404 : 500);
  }

  return okResponse(result.data);
});
