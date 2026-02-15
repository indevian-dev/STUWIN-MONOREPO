import { NextRequest } from 'next/server';
import { unifiedApiHandler } from '@/lib/middleware/handlers';
import { qstashReceiver } from '@/lib/integrations/upstash/qstash.client';
import { okResponse, errorResponse, serverErrorResponse } from '@/lib/middleware/responses/ApiResponse';

/**
 * POST /api/workspaces/jobs/mass-report-scanner
 * 
 * Batch scanner for mass report generation
 * Decoupled into JobService
 */
export const POST = unifiedApiHandler(async (request: NextRequest, { module, log }) => {
  // ================================================================
  // SECURITY: Verify QStash Signature
  // ================================================================
  const signature = request.headers.get('upstash-signature');
  const body = await request.text();
  const url = request.url;

  if (signature && process.env.NODE_ENV === 'production') {
    try {
      const isValid = await qstashReceiver.verify({
        body,
        signature,
        url,
      });
      if (!isValid) {
        return errorResponse('Unauthorized: Invalid signature', 401, "UNAUTHORIZED");
      }
    } catch (verifyError) {
      if (log) log.error('Signature verification failed', verifyError);
      return errorResponse('Unauthorized: Signature verification failed', 401, "UNAUTHORIZED");
    }
  }

  // ================================================================
  // PARSE REQUEST PARAMETERS
  // ================================================================
  const searchParams = new URL(request.url).searchParams;
  const lastId = searchParams.get('lastId') || undefined;

  // Try to parse correlationId from body if it was a JSON body
  let correlationId: string | undefined;
  try {
    const parsedBody = JSON.parse(body);
    correlationId = parsedBody.correlationId;
  } catch (e) {
    // Not JSON or no correlationId, JobService will generate one
  }

  // Delegate to JobService
  const result = await module.jobs.scanStudentsForReports({
    lastId,
    correlationId
  });

  if (!result.success) {
    return serverErrorResponse(result.error);
  }

  return okResponse(result);
});

/**
 * GET /api/workspaces/jobs/mass-report-scanner
 * 
 * Health check endpoint
 */
export const GET = unifiedApiHandler(async () => {
  return okResponse({ service: 'Mass Report Scanner', status: 'healthy', timestamp: new Date().toISOString() });
});
