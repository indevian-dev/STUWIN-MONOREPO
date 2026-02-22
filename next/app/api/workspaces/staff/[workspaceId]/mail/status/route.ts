import { NextRequest } from 'next/server';
import { okResponse, serverErrorResponse } from '@/lib/middleware/Response.Api.middleware';
import { unifiedApiHandler } from "@/lib/middleware/_Middleware.index";

export const GET = unifiedApiHandler(async (request: NextRequest, { module }) => {
  const result = await module.mail.getStatus();
  if (!result.success) {
    return serverErrorResponse(result.error);
  }
  return okResponse(result.data);
});
