import { NextRequest } from 'next/server';
import { errorResponse } from '@/lib/middleware/responses/ApiResponse';
import { unifiedApiHandler } from "@/lib/middleware/handlers";

export const POST = unifiedApiHandler(
  async (request: NextRequest, { log }) => {
    if (log) log.info("User create endpoint placeholder");
    return errorResponse("Not implemented", 501, "NOT_IMPLEMENTED");
  }
);
