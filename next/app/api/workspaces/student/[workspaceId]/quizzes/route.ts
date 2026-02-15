import { NextRequest } from 'next/server';
import { unifiedApiHandler, type UnifiedContext } from "@/lib/middleware/handlers/ApiInterceptor";
import { okResponse, serverErrorResponse } from '@/lib/middleware/responses/ApiResponse';

export const GET = unifiedApiHandler(
  async (request: NextRequest, ctx: UnifiedContext) => {
    const { module, auth, log, params } = ctx;
    const accountId = auth.accountId;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") || "20", 10);
    const status = searchParams.get("status") || undefined;
    const subjectId = searchParams.get("subjectId") || undefined;

    // Extract workspaceId from route params
    const workspaceId = (params as any)?.workspaceId as string;

    log.debug("Fetching user quizzes", { accountId, page, pageSize, workspaceId });

    try {
      const result = await module.quiz.list(accountId, {
        page,
        pageSize,
        status,
        subjectId,
        workspaceId
      });

      if (!result.success || !result.data) {
        return serverErrorResponse(result.error || "Failed to fetch quizzes");
      }

      log.info("User quizzes fetched", { count: result.data.quizzes.length, total: result.data.pagination.total });

      return okResponse({ operation: "success", quizzes: result.data.quizzes, ...result.data.pagination, hasNextPage: page < result.data.pagination.totalPages, hasPrevPage: page > 1,  });
    } catch (error) {
      log.error("Error fetching user quizzes", error);
      return serverErrorResponse("Error fetching quizzes");
    }
  },
);
