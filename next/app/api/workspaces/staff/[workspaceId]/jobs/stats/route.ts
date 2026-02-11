import { NextRequest, NextResponse } from "next/server";
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
      return NextResponse.json(stats);
    } catch (error) {
      if (log) log.error("Failed to fetch job stats", error);
      return NextResponse.json(
        { error: "Failed to fetch job stats" },
        { status: 500 }
      );
    }
  },
);
