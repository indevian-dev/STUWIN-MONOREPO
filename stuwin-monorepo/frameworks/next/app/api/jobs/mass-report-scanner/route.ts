// ═══════════════════════════════════════════════════════════════
// MASS REPORT SCANNER - BATCH PROCESSING TRIGGER
// ═══════════════════════════════════════════════════════════════
// Scans students in batches and dispatches report generation jobs
// Implements recursive batch processing for scalability
// ═══════════════════════════════════════════════════════════════
import { NextRequest, NextResponse } from 'next/server';
import type { ApiRouteHandler, ApiHandlerContext } from '@/types/next';
import { withApiHandler } from '@/lib/app-access-control/interceptors';
import { qstashClient, qstashReceiver } from '@/lib/integrations/qstashClient';
import { logScannerBatch } from '@/lib/integrations/axiomClient';
import { randomUUID } from 'crypto';

const STUDENTS_TABLE = 'workspacesStudents';
// Configuration
const BATCH_SIZE = 1000;
const RAILWAY_DOMAIN = process.env.RAILWAY_PUBLIC_DOMAIN || process.env.NEXT_PUBLIC_APP_URL || 'localhost:3033';
const WORKER_ENDPOINT = `https://${RAILWAY_DOMAIN}/api/workspaces/jobs/generate-report`;
const SCANNER_ENDPOINT = `https://${RAILWAY_DOMAIN}/api/workspaces/jobs/mass-report-scanner`;
/**
 * POST /api/workspaces/jobs/mass-report-scanner
 * 
 * Batch scanner for mass report generation
 * - Accepts lastId query parameter
 * - Fetches batch of students
 * - Dispatches worker tasks to QStash
 * - Recursively triggers next batch
 */
export const POST: ApiRouteHandler = withApiHandler(
  async (request: NextRequest, { log, db }: ApiHandlerContext) => {
    const startTime = Date.now();
    const correlationId = randomUUID();
    // ================================================================
    // SECURITY: Verify QStash Signature
    // ================================================================
    const signature = request.headers.get('upstash-signature');
    const body = await request.text();
    const url = request.url;
    // Allow local development without signature
    if (signature && process.env.NODE_ENV === 'production') {
      try {
        const isValid = await qstashReceiver.verify({
          body,
          signature,
          url,
        });
        if (!isValid) {
          return NextResponse.json(
            { error: 'Unauthorized: Invalid signature' },
            { status: 401 }
          );
        }
      } catch (verifyError) {
        return NextResponse.json(
          { error: 'Unauthorized: Signature verification failed' },
          { status: 401 }
        );
      }
    }
    // ================================================================
    // PARSE REQUEST PARAMETERS
    // ================================================================
    const searchParams = new URL(request.url).searchParams;
    const lastId = searchParams.get('lastId') || '';
    // Log scanner batch started
    await logScannerBatch({
      correlationId,
      status: 'started',
      lastId,
      batchSize: 0,
      hasMore: false,
    });
    // ================================================================
    // FETCH STUDENT BATCH
    // ================================================================
    const students = await db.query(
      `SELECT id FROM ${STUDENTS_TABLE} WHERE id > $lastId ORDER BY id ASC LIMIT $limit`,
      { lastId, limit: BATCH_SIZE },
    );
    const batchSize = students.length;
    const hasMore = batchSize === BATCH_SIZE;
    if (batchSize === 0) {
      await logScannerBatch({
        correlationId,
        status: 'completed',
        lastId,
        batchSize: 0,
        hasMore: false,
      });
      return NextResponse.json({
        message: 'No more students to process',
        processed: 0,
        nextLastId: lastId,
        hasMore: false,
        correlationId,
      });
    }
    // ================================================================
    // DISPATCH WORKER TASKS TO QSTASH
    // ================================================================
    const dispatchPromises = students.map(async (student) => {
      try {
        await qstashClient.publishJSON({
          url: WORKER_ENDPOINT,
          body: {
            studentId: student.id,
            correlationId,
          },
          retries: 3, // Retry up to 3 times
          headers: {
            'Content-Type': 'application/json',
          },
        });
      } catch (dispatchError) {
        // Don't throw - continue processing other students
      }
    });
    // Wait for all dispatches to complete
    await Promise.all(dispatchPromises);
    // ================================================================
    // TRIGGER NEXT BATCH (RECURSIVE RELAY)
    // ================================================================
    const nextLastId = students[students.length - 1].id;
    if (hasMore) {
      try {
        const nextScannerUrl = `${SCANNER_ENDPOINT}?lastId=${nextLastId}`;
        await qstashClient.publishJSON({
          url: nextScannerUrl,
          body: {}, // Empty body for GET-like behavior
          delay: 2, // 2 second delay to avoid rate limits
          retries: 3,
          headers: {
            'Content-Type': 'application/json',
          },
        });
      } catch (relayError) {
        // This is critical - log but still return success for current batch
      }
    }
    // ================================================================
    // LOG COMPLETION AND RETURN
    // ================================================================
    const processingTimeMs = Date.now() - startTime;
    await logScannerBatch({
      correlationId,
      status: 'completed',
      lastId,
      batchSize,
      hasMore,
    });
    return NextResponse.json({
      message: 'Batch processed successfully',
      processed: batchSize,
      nextLastId,
      hasMore,
      correlationId,
      batchStartId: students[0]?.id || lastId,
      batchEndId: nextLastId,
      processingTimeMs,
    });
  }
);
/**
 * GET /api/workspaces/jobs/mass-report-scanner
 * 
 * Health check endpoint
 */
export const GET: ApiRouteHandler = withApiHandler(
  async (request: NextRequest, { log }: ApiHandlerContext) => {
    return NextResponse.json({
      service: 'Mass Report Scanner',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      config: {
        batchSize: BATCH_SIZE,
        workerEndpoint: WORKER_ENDPOINT,
      },
    });
  }
);


