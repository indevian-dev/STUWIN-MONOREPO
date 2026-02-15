import { NextRequest } from 'next/server';
import { okResponse, serverErrorResponse } from '@/lib/middleware/responses/ApiResponse';
import { unifiedApiHandler } from "@/lib/middleware/handlers";

export const GET = unifiedApiHandler(async (request: NextRequest, { module }) => {
  const result = await module.mail.getStatus();
  if (!result.success) {
    return serverErrorResponse(result.error);
  }
  return okResponse(result.data);
});
