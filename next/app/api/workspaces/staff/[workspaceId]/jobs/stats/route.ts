import { NextRequest } from 'next/server';
import { okResponse, serverErrorResponse } from '@/lib/middleware/responses/ApiResponse';
import { unifiedApiHandler } from "@/lib/middleware/handlers";

/**
 * GET /api/workspaces/staff/jobs/stats
 *
 * Get aggregated statistics for background jobs
 * Decoupled into JobService
 */
export const GET = unifiedApiHandler(
  async (request: NextRequest, { module, log }) => {
    try {
      const stats = await module.jobs.getWorkerStats();
      return okResponse(stats);
    } catch (error) {
      if (log) log.error("Failed to fetch job stats", error);
      return serverErrorResponse("Failed to fetch job stats");
    }
  },
);
