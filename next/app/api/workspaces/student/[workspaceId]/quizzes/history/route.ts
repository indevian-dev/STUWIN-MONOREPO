import { NextRequest } from 'next/server';
import { unifiedApiHandler, type UnifiedContext } from "@/lib/middleware/handlers/ApiInterceptor";
import { okResponse, serverErrorResponse } from '@/lib/middleware/responses/ApiResponse';

export const GET = unifiedApiHandler(
  async (request: NextRequest, { module, auth, log, isValidSlimId }: UnifiedContext) => {
    const accountId = auth.accountId;
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") || "20", 10);
    const status = searchParams.get("status") || undefined;
    const subjectId = searchParams.get("subjectId");

    log.debug("Fetching quiz history via module", { accountId, page, pageSize, status, subjectId });

    try {
      let validSubjectId: string | undefined = undefined;
      if (subjectId) {
        const trimmedSubjectId = subjectId.trim();
        if (isValidSlimId(trimmedSubjectId)) {
          validSubjectId = trimmedSubjectId;
        }
      }

      const result = await module.quiz.list(accountId, {
        page,
        pageSize,
        status,
        subjectId: validSubjectId
      });

      if (!result.success || !result.data) {
        return serverErrorResponse(result.error || "Failed to fetch quiz history");
      }

      const { quizzes, pagination } = result.data;

      // Normalize quizzes to ensure status is never null (ActivityService returns what DB has, typically not null if defaulted)
      // history route did explicit normalization.
      const normalizedQuizzes = quizzes.map((quiz: any) => ({
        ...quiz,
        status: quiz.status || "in_progress",
      }));

      log.info("Quiz history fetched", { count: normalizedQuizzes.length, total: pagination.total });

      return okResponse({ quizzes: normalizedQuizzes, page: pagination.page, pageSize: pagination.pageSize, total: pagination.total, totalPages: pagination.totalPages, hasNextPage: pagination.page < pagination.totalPages, hasPrevPage: pagination.page > 1 });
    } catch (error) {
      log.error("Error fetching quiz history", error);
      return serverErrorResponse("Failed to fetch quiz history");
    }
  },
);
