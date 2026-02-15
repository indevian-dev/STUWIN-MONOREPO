import { NextRequest } from 'next/server';
import { unifiedApiHandler } from "@/lib/middleware/handlers";
import { errorResponse } from '@/lib/middleware/responses/ApiResponse';

export const GET = unifiedApiHandler(
  async (request: NextRequest, { log }) => {
    log.info("Accounts list endpoint placeholder");
    return errorResponse("Not implemented", 501, "NOT_IMPLEMENTED");
  },
);
