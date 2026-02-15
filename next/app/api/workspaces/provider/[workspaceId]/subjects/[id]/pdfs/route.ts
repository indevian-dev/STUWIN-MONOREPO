
import { unifiedApiHandler } from "@/lib/middleware/handlers";
import { okResponse, errorResponse, serverErrorResponse } from '@/lib/middleware/responses/ApiResponse';

export const GET = unifiedApiHandler(async (request, { module, params }) => {
  const { id } = await params;

  if (!id) {
    return errorResponse("Invalid subject ID", 400);
  }

  const result = await module.subject.getPdfs(id);

  if (!result.success) {
    return serverErrorResponse(result.error || "Failed to fetch subject PDFs");
  }

  return okResponse(result.data);
});
