import { NextRequest, NextResponse } from "next/server";
import { unifiedApiHandler, type UnifiedContext } from "@/lib/middleware/handlers/ApiInterceptor";

export const POST = unifiedApiHandler(
  async (request: NextRequest, { module, params, auth, log }: UnifiedContext) => {
    const questionId = params?.id as string;
    const accountId = auth.accountId;

    if (!questionId) {
      return NextResponse.json({ error: "Question ID is required" }, { status: 400 });
    }

    try {
      // Get the question
      const questionResult = await module.question.getById(questionId);
      if (!questionResult.success) {
        return NextResponse.json({ error: "Question not found" }, { status: 404 });
      }

      // Update question to be published
      const updateResult = await module.question.update(questionId, {
        isPublished: true,
        reviewerAccountId: accountId,
        updatedAt: new Date(),
      });

      if (!updateResult.success) {
        return NextResponse.json({ error: "Failed to publish question" }, { status: 500 });
      }

      // TODO: Create notification for author if needed
      // This can be handled in a separate service or here

      return NextResponse.json({
        success: true,
        message: "Question published successfully",
        data: updateResult.data
      }, { status: 200 });

    } catch (error) {
      log.error("Error syncing (publishing) question", error);
      return NextResponse.json({ error: "Failed to publish question" }, { status: 500 });
    }
  },
);
