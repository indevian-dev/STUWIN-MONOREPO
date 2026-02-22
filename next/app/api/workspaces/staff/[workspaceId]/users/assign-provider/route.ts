import { NextRequest } from "next/server";
import { unifiedApiHandler } from "@/lib/middleware/_Middleware.index";
import { errorResponse } from '@/lib/middleware/Response.Api.middleware';

export const POST = unifiedApiHandler(
  async (req: NextRequest) => {
    return errorResponse("Endpoint temporarily disabled for refactoring", 503, "SERVICE_UNAVAILABLE");
  }
);
