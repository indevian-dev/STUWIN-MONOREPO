import { NextRequest } from 'next/server';
import { unifiedApiHandler, type UnifiedContext } from "@/lib/middleware/handlers/ApiInterceptor";
import { okResponse, createdResponse, errorResponse, serverErrorResponse } from '@/lib/middleware/responses/ApiResponse';

/**
 * GET /api/workspaces/student/[workspaceId]/homeworks
 * List all student's homeworks using Service layer
 */
export const GET = unifiedApiHandler(
  async (request: NextRequest, { module, auth, log }: UnifiedContext) => {
    const result = await module.homework.list(auth.accountId);

    if (!result.success) {
      log.error("Failed to list homeworks", { error: result.error });
      return serverErrorResponse(result.error);
    }

    return okResponse(result.data);
  },
);

/**
 * POST /api/workspaces/student/[workspaceId]/homeworks
 * Create a new homework submission using Service layer
 */
export const POST = unifiedApiHandler(
  async (request: NextRequest, { module, auth, log, params }: UnifiedContext) => {
    try {
      const body = await request.json();

      if (!body.title) {
        return errorResponse("Title is required", 400);
      }

      const result = await module.homework.submit(auth.accountId, {
        title: body.title,
        workspaceId: params?.workspaceId as string,
        topicId: body.topicId,
        description: body.description,
        textContent: body.textContent,
        media: body.media || [],
      });

      if (!result.success) {
        log.error("Failed to submit homework", { error: result.error });
        return errorResponse(result.error, 400);
      }

      return createdResponse(result.data);
    } catch (error) {
      log.error("POST homework error", error);
      return errorResponse("Invalid request", 400);
    }
  },
);
