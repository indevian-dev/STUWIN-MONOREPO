import { NextRequest } from 'next/server';
import { okResponse, errorResponse, messageResponse } from '@/lib/middleware/Response.Api.middleware';
import { unifiedApiHandler } from "@/lib/middleware/_Middleware.index";

export const GET = unifiedApiHandler(async (request: NextRequest, { params, module }) => {
  if (!params) {
    return errorResponse("Missing parameters");
  }
  const { id } = await params;
  if (!id) {
    return errorResponse("Invalid prompt ID");
  }

  const result = await module.content.getPromptDetails(id);

  if (!result.success) {
    return errorResponse(result.error, (result as any).code || 500);
  }

  return okResponse(result.data);
});

export const PUT = unifiedApiHandler(async (request: NextRequest, { params, authData, module }) => {
  if (!authData) {
    return errorResponse("Unauthorized", 401, "UNAUTHORIZED");
  }
  if (!params) {
    return errorResponse("Missing parameters");
  }
  const { id } = await params;
  if (!id) {
    return errorResponse("Invalid prompt ID");
  }

  const body = await request.json();
  const result = await module.content.updatePrompt(id, body);

  if (!result.success) {
    return errorResponse(result.error, (result as any).code || 500);
  }

  return okResponse(result.data);
});

export const DELETE = unifiedApiHandler(async (request: NextRequest, { params, authData, module }) => {
  if (!authData) {
    return errorResponse("Unauthorized", 401, "UNAUTHORIZED");
  }
  if (!params) {
    return errorResponse("Missing parameters");
  }
  const { id } = await params;
  if (!id) {
    return errorResponse("Invalid prompt ID");
  }

  const result = await module.content.deletePrompt(id);

  if (!result.success) {
    return errorResponse(result.error, (result as any).code || 500);
  }

  return messageResponse(result.message ?? "Prompt deleted successfully");
});
