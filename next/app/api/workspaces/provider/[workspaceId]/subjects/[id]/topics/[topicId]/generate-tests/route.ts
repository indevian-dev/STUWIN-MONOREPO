import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { unifiedApiHandler } from "@/lib/middleware/handlers";

export const POST = unifiedApiHandler(async (request, { module, params, isValidSlimId, log, auth }) => {
  const subjectId = params?.id as string;
  const topicId = params?.topicId as string;

  if (!subjectId || !topicId || !isValidSlimId(subjectId) || !isValidSlimId(topicId)) {
    return NextResponse.json(
      { success: false, error: "Invalid subject ID or topic ID" },
      { status: 400 },
    );
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
      return NextResponse.json(
        { success: false, error: generationResult.error || "Failed to generate questions" },
        { status: 500 }
      );
    }

    log.info("AI test generation successful", {
      subjectId,
      topicId,
      accountId: auth.accountId,
      count: generationResult.data.count
    });

    return NextResponse.json({
      success: true,
      data: generationResult.data,
    });
  } catch (error: any) {
    log.error("Failed to generate tests", {
      error: error.message,
      stack: error.stack,
      subjectId,
      topicId,
      accountId: auth.accountId,
    });

    return NextResponse.json(
      {
        success: false,
        error: "Failed to generate tests",
      },
      { status: 500 },
    );
  }
});
