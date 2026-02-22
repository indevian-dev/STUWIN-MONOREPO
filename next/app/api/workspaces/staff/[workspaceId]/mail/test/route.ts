import { NextRequest } from 'next/server';
import { errorResponse, messageResponse } from '@/lib/middleware/Response.Api.middleware';
import { unifiedApiHandler } from "@/lib/middleware/_Middleware.index";

export const POST = unifiedApiHandler(async (request: NextRequest, { module }) => {
  const body = await request.json();
  const { api_key, from_email } = body;

  const result = await module.mail.testConnection(api_key, from_email);

  if (!result.success) {
    return errorResponse(result.error, (result as any).code || 400);
  }

  return messageResponse(result.message ?? "Connection test successful");
});
