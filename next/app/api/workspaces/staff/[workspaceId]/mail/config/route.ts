import { NextRequest } from 'next/server';
import { okResponse, errorResponse, serverErrorResponse, messageResponse } from '@/lib/middleware/Response.Api.middleware';
import { unifiedApiHandler } from "@/lib/middleware/_Middleware.index";

export const GET = unifiedApiHandler(async (request: NextRequest, { module }) => {
  const result = await module.mail.getConfig();
  if (!result.success) {
    return serverErrorResponse(result.error);
  }
  return okResponse(result.data);
});

export const POST = unifiedApiHandler(async (request: NextRequest, { module }) => {
  const body = await request.json();
  const result = await module.mail.updateConfig(body);

  if (!result.success) {
    return errorResponse(result.error, (result as any).code || 500);
  }

  return messageResponse(result.message ?? "Config updated successfully");
});
