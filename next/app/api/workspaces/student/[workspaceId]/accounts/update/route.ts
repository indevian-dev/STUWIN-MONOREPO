import { NextRequest } from 'next/server';
import { unifiedApiHandler } from "@/lib/middleware/handlers";
import { errorResponse } from '@/lib/middleware/responses/ApiResponse';

export const PATCH = unifiedApiHandler(
  async (request: NextRequest, { log }) => {
    log.info("Account update endpoint placeholder");
    return errorResponse("Not implemented", 501, "NOT_IMPLEMENTED");
  },
);
