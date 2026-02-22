import { NextRequest } from 'next/server';
import { okResponse, createdResponse, errorResponse, serverErrorResponse } from '@/lib/middleware/Response.Api.middleware';
import { unifiedApiHandler } from "@/lib/middleware/_Middleware.index";

export const GET = unifiedApiHandler(async (request: NextRequest, { module }) => {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");
  const search = searchParams.get("search") || undefined;

  const result = await module.content.managePrompts({ page, limit, search });

  if (!result.success) {
    return serverErrorResponse(result.error);
  }

  return okResponse(result.data);
});

export const POST = unifiedApiHandler(async (request: NextRequest, { authData, module }) => {
  if (!authData) {
    return errorResponse("Unauthorized", 401, "UNAUTHORIZED");
  }

  const body = await request.json();
  const result = await module.content.createPrompt(body);

  if (!result.success) {
    return errorResponse(result.error, (result as any).code || 500);
  }

  return createdResponse(result.data);
});
