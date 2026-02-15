import { NextRequest } from "next/server";
import { unifiedApiHandler } from "@/lib/middleware/handlers";
import { okResponse, errorResponse, serverErrorResponse } from '@/lib/middleware/responses/ApiResponse';
export const GET = unifiedApiHandler(async (request: NextRequest, { authData, module, log }) => {
  try {
    if (!authData) {
      return errorResponse("Unauthorized", 401, "UNAUTHORIZED");
    }
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    if (!type) {
      return errorResponse("Type parameter is required");
    }

    const result = await module.content.getPage(type);
    if (!result.success) {
      return errorResponse(result.error, (result as any).code || 404, "NOT_FOUND");
    }

    return okResponse(result.data);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch doc';
    if (log) log.error("Failed to fetch doc", error);
    return serverErrorResponse(errorMessage);
  }
});
