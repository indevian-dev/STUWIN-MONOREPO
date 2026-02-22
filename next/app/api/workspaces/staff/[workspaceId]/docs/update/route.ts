import { NextRequest } from "next/server";
import { unifiedApiHandler } from "@/lib/middleware/_Middleware.index";
import { okResponse, errorResponse } from '@/lib/middleware/Response.Api.middleware';

export const PUT = unifiedApiHandler(async (request: NextRequest, { authData, module }) => {
  if (!authData) {
    return errorResponse("Unauthorized", 401, "UNAUTHORIZED");
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');

  if (!type) {
    return errorResponse("Valid doc type is required");
  }

  const body = await request.json();
  const result = await module.content.updatePageContent(type, body);

  if (!result.success) {
    return errorResponse(result.error, (result as any).code || 500);
  }

  return okResponse(result.data, "Doc updated successfully");
});
