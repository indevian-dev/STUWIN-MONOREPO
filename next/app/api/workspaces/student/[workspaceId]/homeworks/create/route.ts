import { NextRequest } from 'next/server';
import { unifiedApiHandler } from "@/lib/middleware/_Middleware.index";
import { createdResponse, errorResponse, serverErrorResponse } from '@/lib/middleware/Response.Api.middleware';

/**
 * POST /api/workspaces/student/[workspaceId]/homeworks/create
 * Create a new homework submission
 */
export const POST = unifiedApiHandler(
  async (request: NextRequest, { module, auth, log, params }) => {
    try {
      const body = await request.json();
      const { title, description, topicId, media, textContent } = body;

      if (!title) {
        return errorResponse("title is required", 400);
      }

      log.info('Creating homework', { accountId: auth.accountId, title });

      const result = await module.homework.submit(auth.accountId, {
        title,
        workspaceId: params.workspaceId as string,
        topicId,
        description,
        textContent,
        media: media || [],
      });

      if (!result.success || !result.data) {
        log.error("Failed to create homework", { error: result.error });
        return serverErrorResponse(result.error || "Failed to create homework");
      }

      return createdResponse({ success: true, homework: result.data, });
    } catch (error) {
      log.error("POST homework error", error);
      return serverErrorResponse("Failed to create homework");
    }
  },
);
