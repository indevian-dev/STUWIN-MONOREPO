import { NextRequest } from "next/server";
import { unifiedApiHandler } from "@/lib/middleware/handlers";
import { errorResponse } from '@/lib/middleware/responses/ApiResponse';

export const POST = unifiedApiHandler(
  async (req: NextRequest) => {
    return errorResponse("Endpoint temporarily disabled for refactoring", 503, "SERVICE_UNAVAILABLE");
  }
);
