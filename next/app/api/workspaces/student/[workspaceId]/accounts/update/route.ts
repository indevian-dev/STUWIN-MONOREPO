import { NextRequest } from 'next/server';
import { unifiedApiHandler } from "@/lib/middleware/_Middleware.index";
import { errorResponse } from '@/lib/middleware/Response.Api.middleware';

export const PATCH = unifiedApiHandler(
  async (request: NextRequest, { log }) => {
    log.info("Account update endpoint placeholder");
    return errorResponse("Not implemented", 501, "NOT_IMPLEMENTED");
  },
);
