// ═══════════════════════════════════════════════════════════════
// STAFF JOBS STATISTICS API
// ═══════════════════════════════════════════════════════════════
// API for background job statistics and metrics
// Aggregates data from Axiom logs
// ═══════════════════════════════════════════════════════════════
import { NextRequest, NextResponse } from "next/server";
import type { ApiRouteHandler, ApiHandlerContext } from "@/types/next";
import { withApiHandler } from "@/lib/app-access-control/interceptors";
import axiomClient, {
  AXIOM_BACKGROUND_JOB_DATASET,
} from "@/lib/integrations/axiomClient";
import type {
  JobStatsResponse,
  JobStats,
  JobStatsOverview,
} from "@/types/resources/backgroundJobs";
/**
 * GET /api/workspaces/staff/jobs/stats
 *
 * Get aggregated statistics for background jobs
 */
export const GET: ApiRouteHandler = withApiHandler(
  async (request: NextRequest, { authData, log }: ApiHandlerContext) => {
    // Query for report generation stats
    const reportStatsQuery = `
      ['${AXIOM_BACKGROUND_JOB_DATASET}']
      | where jobType in ('scanner', 'worker')
      | where _time >= ago(30d)
      | summarize
          totalRuns = count(),
          successfulRuns = countif(status == 'completed'),
          failedRuns = countif(status == 'failed'),
          lastRun = max(_time)
    `;
    // Query for question generation stats
    const questionStatsQuery = `
      ['${AXIOM_BACKGROUND_JOB_DATASET}']
      | where jobType in ('topic-scanner', 'topic-worker')
      | where _time >= ago(30d)
      | summarize
          totalRuns = count(),
          successfulRuns = countif(status == 'completed'),
          failedRuns = countif(status == 'failed'),
          lastRun = max(_time)
    `;
    // Query for recent activity
    const recentActivityQuery = `
      ['${AXIOM_BACKGROUND_JOB_DATASET}']
      | where jobType in ('scanner', 'worker', 'topic-scanner', 'topic-worker')
      | where _time >= ago(24h)
      | order by _time desc
      | limit 20
      | project _time, jobType, status
    `;
    // Execute queries in parallel
    const [reportStatsResult, questionStatsResult, recentActivityResult] =
      await Promise.all([
        axiomClient.query(reportStatsQuery),
        axiomClient.query(questionStatsQuery),
        axiomClient.query(recentActivityQuery),
      ]);
    // Parse report generation stats
    const reportStats: JobStats = {
      jobType: "Report Generation",
      totalRuns: 0,
      successfulRuns: 0,
      failedRuns: 0,
      successRate: 0,
      avgProcessingTime: 0,
      lastRun: null,
    };
    if (reportStatsResult.matches && reportStatsResult.matches.length > 0) {
      const data = reportStatsResult.matches[0].data as any;
      reportStats.totalRuns = data.totalRuns || 0;
      reportStats.successfulRuns = data.successfulRuns || 0;
      reportStats.failedRuns = data.failedRuns || 0;
      reportStats.successRate =
        reportStats.totalRuns > 0
          ? (reportStats.successfulRuns / reportStats.totalRuns) * 100
          : 0;
      reportStats.avgProcessingTime = 0; // TODO: Add back when field is available
      reportStats.lastRun = data.lastRun ? new Date(data.lastRun) : null;
    }
    // Parse question generation stats
    const questionStats: JobStats = {
      jobType: "Question Generation",
      totalRuns: 0,
      successfulRuns: 0,
      failedRuns: 0,
      successRate: 0,
      avgProcessingTime: 0,
      lastRun: null,
    };
    if (questionStatsResult.matches && questionStatsResult.matches.length > 0) {
      const data = questionStatsResult.matches[0].data as any;
      questionStats.totalRuns = data.totalRuns || 0;
      questionStats.successfulRuns = data.successfulRuns || 0;
      questionStats.failedRuns = data.failedRuns || 0;
      questionStats.successRate =
        questionStats.totalRuns > 0
          ? (questionStats.successfulRuns / questionStats.totalRuns) * 100
          : 0;
      questionStats.avgProcessingTime = 0; // TODO: Add back when field is available
      questionStats.lastRun = data.lastRun ? new Date(data.lastRun) : null;
    }
    // Parse recent activity
    const recentActivity: JobStatsResponse["recentActivity"] = [];
    if (recentActivityResult.matches) {
      for (const match of recentActivityResult.matches) {
        const data = match.data as any;
        recentActivity.push({
          timestamp: new Date(data._time),
          jobType: data.jobType,
          status: data.status,
          duration: undefined, // TODO: Add back when field is available
        });
      }
    }
    // Build overview
    const overview: JobStatsOverview = {
      reportGeneration: reportStats,
      questionGeneration: questionStats,
      totalQueueDepth: 0, // TODO: Get from QStash if API available
    };
    const response: JobStatsResponse = {
      overview,
      recentActivity,
    };
    return NextResponse.json(response);
  },
);
