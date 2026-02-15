import type { NextRequest } from "next/server";
import { unifiedApiHandler } from "@/lib/middleware/handlers";
import { okResponse, errorResponse, serverErrorResponse } from '@/lib/middleware/responses/ApiResponse';

export const POST = unifiedApiHandler(async (request, { module, params, isValidSlimId, log, auth }) => {
  const subjectId = params?.id as string;
  const topicId = params?.topicId as string;

  if (!subjectId || !topicId || !isValidSlimId(subjectId) || !isValidSlimId(topicId)) {
    return errorResponse("Invalid subject ID or topic ID", 400);
  }

  try {
    let count = 10;
    try {
      const body = await request.json();
      if (body && typeof body.count === 'number') {
        count = Math.max(1, Math.min(10, body.count));
      }
    } catch (e) {
      // Body might be empty, ignore
    }

    // Call the Topic Service to generate real questions using AI
    const generationResult = await module.topic.generateQuestions(topicId, subjectId, count);

    if (!generationResult.success) {
      return serverErrorResponse(generationResult.error || "Failed to generate questions");
    }

    log.info("AI test generation successful", {
      subjectId,
      topicId,
      accountId: auth.accountId,
      count: generationResult.data.count
    });

    return okResponse(generationResult.data);
  } catch (error: any) {
    log.error("Failed to generate tests", {
      error: error.message,
      stack: error.stack,
      subjectId,
      topicId,
      accountId: auth.accountId,
    });

    return serverErrorResponse("Failed to generate tests");
  }
});
