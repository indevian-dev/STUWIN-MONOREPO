import { NextRequest, NextResponse } from "next/server";
import { unifiedApiHandler } from "@/lib/middleware/handlers";
import { qstashReceiver } from "@/lib/integrations/upstash/qstash.client";

/**
 * POST /api/workspaces/jobs/generate-topic-questions
 *
 * Worker endpoint for generating questions for individual topics
 * Decoupled into JobService
 */
export const POST = unifiedApiHandler(
  async (request: NextRequest, { module, log }) => {
    // ================================================================
    // SECURITY: Verify QStash Signature
    // ================================================================
    const signature = request.headers.get("upstash-signature");
    const bodyText = await request.text();
    const url = request.url;

    if (signature && process.env.NODE_ENV === "production") {
      try {
        const isValid = await qstashReceiver.verify({
          body: bodyText,
          signature,
          url,
        });
        if (!isValid) {
          return NextResponse.json(
            { error: "Unauthorized: Invalid signature" },
            { status: 401 },
          );
        }
      } catch (verifyError) {
        if (log) log.error("Signature verification failed", verifyError);
        return NextResponse.json(
          { error: "Unauthorized: Signature verification failed" },
          { status: 401 },
        );
      }
    }

    // ================================================================
    // PARSE REQUEST BODY
    // ================================================================
    let requestData;
    try {
      requestData = JSON.parse(bodyText);
    } catch (e) {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { topicId, correlationId, questionsToGenerate } = requestData;

    if (!topicId || !correlationId || !questionsToGenerate) {
      return NextResponse.json(
        { error: "Missing topicId, correlationId, or questionsToGenerate" },
        { status: 400 },
      );
    }

    // Delegate to JobService
    const result = await module.jobs.generateQuestionsForTopic({
      topicId,
      correlationId,
      questionsToGenerate
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, topicId, error: result.error },
        { status: result.status || 500 },
      );
    }

    return NextResponse.json(result);
  }
);

/**
 * GET /api/workspaces/jobs/generate-topic-questions
 *
 * Health check endpoint
 */
export const GET = unifiedApiHandler(async () => {
  return NextResponse.json({
    service: "Generate Topic Questions Worker",
    status: "healthy",
    timestamp: new Date().toISOString()
  });
});
