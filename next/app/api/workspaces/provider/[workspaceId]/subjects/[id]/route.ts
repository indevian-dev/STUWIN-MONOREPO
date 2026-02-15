
import { unifiedApiHandler } from "@/lib/middleware/handlers";
import { okResponse, errorResponse } from '@/lib/middleware/responses/ApiResponse';

export const GET = unifiedApiHandler(async (request, { module, params }) => {
  const { id } = await params;

  if (!id) {
    return errorResponse("Invalid ID", 400);
  }

  const result = await module.subject.getOverview(id);

  if (!result.success || !result.data) {
    return errorResponse(result.error || "Subject not found", 404);
  }

  return okResponse(result.data);
});
