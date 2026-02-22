
import { unifiedApiHandler } from "@/lib/middleware/_Middleware.index";
import { okResponse, errorResponse, serverErrorResponse } from '@/lib/middleware/Response.Api.middleware';

export const POST = unifiedApiHandler(async (request, { module, params }) => {
  const { id } = await params;

  if (!id) {
    return errorResponse("Invalid Subject ID", 400);
  }
  const subjectId = id as string;

  const body = await request.json();
  const { topics } = body;

  if (!Array.isArray(topics) || topics.length === 0) {
    return errorResponse("No topics provided", 400);
  }

  const result = await module.topic.bulkCreate(subjectId, topics);

  if (!result.success || !result.data) {
    return serverErrorResponse(result.error || "Failed to create topics");
  }

  return okResponse(result.data, `Successfully created ${result.data.length} topics`);
});
