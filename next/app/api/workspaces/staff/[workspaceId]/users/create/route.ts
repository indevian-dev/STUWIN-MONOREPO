import { NextRequest } from 'next/server';
import { errorResponse } from '@/lib/middleware/Response.Api.middleware';
import { unifiedApiHandler } from "@/lib/middleware/_Middleware.index";

export const POST = unifiedApiHandler(
  async (request: NextRequest, { log }) => {
    if (log) log.info("User create endpoint placeholder");
    return errorResponse("Not implemented", 501, "NOT_IMPLEMENTED");
  }
);
