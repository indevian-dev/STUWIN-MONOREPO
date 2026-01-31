'use client';

// ═══════════════════════════════════════════════════════════════
// STAFF JOBS API HELPER
// ═══════════════════════════════════════════════════════════════
// Centralized API helper for staff job management endpoints
// ═══════════════════════════════════════════════════════════════

import { apiCallForSpaHelper } from './apiCallForSpaHelper';
import type {
  JobLogsResponse,
  JobStatsResponse,
  JobControlRequest,
  BackgroundJob,
  LogJobType,
  LogStatus
} from '@/lib/app-core-modules/jobs/jobs.types';

// ═══════════════════════════════════════════════════════════════
// JOB LOGS API
// ═══════════════════════════════════════════════════════════════

export interface FetchLogsParams {
  jobType?: LogJobType[];
  status?: LogStatus[];
  correlationId?: string;
  startTime?: string;
  endTime?: string;
  limit?: number;
  offset?: number;
}

/**
 * Fetch job logs with optional filters
 */
export async function fetchJobLogs(params: FetchLogsParams): Promise<JobLogsResponse> {
  const queryParams: Record<string, string> = {};

  if (params.jobType && params.jobType.length > 0) {
    queryParams.jobType = params.jobType.join(',');
  }
  if (params.status && params.status.length > 0) {
    queryParams.status = params.status.join(',');
  }
  if (params.correlationId) {
    queryParams.correlationId = params.correlationId;
  }
  if (params.startTime) {
    queryParams.startTime = params.startTime;
  }
  if (params.endTime) {
    queryParams.endTime = params.endTime;
  }
  if (params.limit) {
    queryParams.limit = params.limit.toString();
  }
  if (params.offset !== undefined) {
    queryParams.offset = params.offset.toString();
  }

  const response = await apiCallForSpaHelper({
    method: 'GET',
    url: '/api/workspaces/staff/jobs/logs',
    params: queryParams,
  });

  // Parse date strings back to Date objects
  const data = response.data as JobLogsResponse;
  if (data.logs) {
    data.logs = data.logs.map(log => ({
      ...log,
      timestamp: log.timestamp ? new Date(log.timestamp) : new Date(),
    }));
  }

  return data;
}

// ═══════════════════════════════════════════════════════════════
// JOB STATS API
// ═══════════════════════════════════════════════════════════════

/**
 * Fetch job statistics
 */
export async function fetchJobStats(): Promise<JobStatsResponse> {
  const response = await apiCallForSpaHelper({
    method: 'GET',
    url: '/api/workspaces/staff/jobs/stats',
  });

  // Parse date strings back to Date objects
  const data = response.data as JobStatsResponse;

  // Parse overview stats dates
  if (data.overview?.reportGeneration?.lastRun) {
    data.overview.reportGeneration.lastRun = new Date(data.overview.reportGeneration.lastRun);
  }
  if (data.overview?.questionGeneration?.lastRun) {
    data.overview.questionGeneration.lastRun = new Date(data.overview.questionGeneration.lastRun);
  }

  // Parse recent activity timestamps
  if (data.recentActivity) {
    data.recentActivity = data.recentActivity.map(activity => ({
      ...activity,
      timestamp: activity.timestamp ? new Date(activity.timestamp) : new Date(),
    }));
  }

  return data;
}

// ═══════════════════════════════════════════════════════════════
// JOB CONTROL API
// ═══════════════════════════════════════════════════════════════

export interface FetchJobsResponse {
  jobs: BackgroundJob[];
}

/**
 * Fetch list of background jobs
 */
export async function fetchJobs(): Promise<FetchJobsResponse> {
  const response = await apiCallForSpaHelper({
    method: 'GET',
    url: '/api/workspaces/staff/jobs/control',
  });

  return response.data;
}

/**
 * Control a background job (pause, resume, or trigger)
 */
export async function controlJob(request: JobControlRequest): Promise<void> {
  await apiCallForSpaHelper({
    method: 'POST',
    url: '/api/workspaces/staff/jobs/control',
    body: request,
  });
}
