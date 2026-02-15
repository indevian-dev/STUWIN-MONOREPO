import type { NextRequest } from "next/server";
import { unifiedApiHandler } from "@/lib/middleware/handlers";
import { errorResponse, messageResponse } from '@/lib/middleware/responses/ApiResponse';

export const POST = unifiedApiHandler(
  async (request: NextRequest, { module }) => {
    const body = await request.json();
    const { filename, filePath } = body;

    if (!filename || !filePath) {
      return errorResponse("Filename and filePath are required");
    }

    const result = await module.workspace.deleteUserMedia(filename, filePath);

    if (!result.success) {
      return errorResponse(result.error, (result as any).code || 500);
    }

    return messageResponse(result.message ?? "Media deleted successfully");
  }
);
