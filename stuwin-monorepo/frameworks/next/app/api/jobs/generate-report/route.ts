import { NextRequest, NextResponse } from "next/server";
import { unifiedApiHandler } from "@/lib/app-access-control/interceptors";
import { qstashReceiver } from "@/lib/integrations/qstashClient";

/**
 * POST /api/workspaces/jobs/generate-report
 *
 * Worker endpoint for generating individual student reports
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

    const { studentId, correlationId } = requestData;

    if (!studentId || !correlationId) {
      return NextResponse.json(
        { error: "Missing studentId or correlationId" },
        { status: 400 },
      );
    }

    // Delegate to JobService
    const result = await module.jobs.generateReportForStudent({
      studentId,
      correlationId
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, studentId, error: result.error },
        { status: result.status || 500 },
      );
    }

    return NextResponse.json(result);
  }
);

/**
 * GET /api/workspaces/jobs/generate-report
 *
 * Health check endpoint
 */
export const GET = unifiedApiHandler(async () => {
  return NextResponse.json({
    service: "Generate Report Worker",
    status: "healthy",
    timestamp: new Date().toISOString()
  });
});
