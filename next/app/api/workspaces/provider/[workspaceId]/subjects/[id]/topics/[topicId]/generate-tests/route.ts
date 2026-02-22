import { unifiedApiHandler } from "@/lib/middleware/_Middleware.index";
import { okResponse, errorResponse, serverErrorResponse } from '@/lib/middleware/Response.Api.middleware';

export const POST = unifiedApiHandler(async (request, { module, params, isValidSlimId, log, auth }) => {
  const subjectId = params?.id as string;
  const topicId = params?.topicId as string;

  if (!subjectId || !topicId || !isValidSlimId(subjectId) || !isValidSlimId(topicId)) {
    return errorResponse("Invalid subject ID or topic ID", 400);
  }

  try {
    let counts = { easy: 2, medium: 2, hard: 1 };

    try {
      const body = await request.json();
      if (body?.counts && typeof body.counts === 'object') {
        counts = {
          easy: Math.max(0, Math.min(5, Number(body.counts.easy) || 0)),
          medium: Math.max(0, Math.min(5, Number(body.counts.medium) || 0)),
          hard: Math.max(0, Math.min(5, Number(body.counts.hard) || 0)),
        };
      } else if (body && typeof body.count === 'number') {
        // Backward compat: single count → all medium
        const count = Math.max(1, Math.min(5, body.count));
        counts = { easy: 0, medium: count, hard: 0 };
      }
    } catch (_e) {
      // Body might be empty, use defaults
    }

    const totalCount = counts.easy + counts.medium + counts.hard;
    if (totalCount === 0) {
      return errorResponse("Total question count must be greater than 0", 400);
    }

    // Call the Topic Service to generate questions with per-complexity counts
    const generationResult = await module.topic.generateQuestions(topicId, subjectId, counts);

    if (!generationResult.success) {
      return serverErrorResponse(generationResult.error || "Failed to generate questions");
    }

    log.info("AI test generation successful", {
      subjectId,
      topicId,
      accountId: auth.accountId,
      count: generationResult.data.count,
      counts,
    });

    return okResponse(generationResult.data);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to generate tests";
    log.error("Failed to generate tests", {
      error: message,
      subjectId,
      topicId,
      accountId: auth.accountId,
    });

    return serverErrorResponse("Failed to generate tests");
  }
});
