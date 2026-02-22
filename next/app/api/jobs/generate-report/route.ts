import { NextRequest } from "next/server";
import { unifiedApiHandler } from "@/lib/middleware/_Middleware.index";
import { qstashReceiver } from "@/lib/integrations/upstash/Qstash.client";
import { okResponse, errorResponse } from '@/lib/middleware/Response.Api.middleware';

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
          return errorResponse("Unauthorized: Invalid signature", 401, "UNAUTHORIZED");
        }
      } catch (verifyError) {
        if (log) log.error("Signature verification failed", verifyError);
        return errorResponse("Unauthorized: Signature verification failed", 401, "UNAUTHORIZED");
      }
    }

    // ================================================================
    // PARSE REQUEST BODY
    // ================================================================
    let requestData;
    try {
      requestData = JSON.parse(bodyText);
    } catch (e) {
      return errorResponse("Invalid JSON body", 400);
    }

    const { studentId, correlationId } = requestData;

    if (!studentId || !correlationId) {
      return errorResponse("Missing studentId or correlationId", 400);
    }

    // Delegate to JobService
    const result = await module.jobs.generateReportForStudent({
      studentId,
      correlationId
    });

    if (!result.success) {
      return errorResponse(result.error, result.status || 500);
    }

    return okResponse(result);
  }
);

/**
 * GET /api/workspaces/jobs/generate-report
 *
 * Health check endpoint
 */
export const GET = unifiedApiHandler(async () => {
  return okResponse({ service: "Generate Report Worker", status: "healthy", timestamp: new Date().toISOString() });
});
