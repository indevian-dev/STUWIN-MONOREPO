// ═══════════════════════════════════════════════════════════════
// STAFF JOBS CONTROL API
// ═══════════════════════════════════════════════════════════════
// API for managing background job schedules
// Pause, resume, trigger, and list jobs
// ═══════════════════════════════════════════════════════════════
import { unifiedApiHandler } from '@/lib/middleware/_Middleware.index';
import { okResponse, errorResponse, serverErrorResponse } from '@/lib/middleware/Response.Api.middleware';
import type {
  JobControlRequest,
  JobControlResponse,
  JobListResponse,
} from '@/lib/domain/jobs/Jobs.types';

/**
 * GET /api/workspaces/staff/jobs/control
 * List all background jobs with their current status
 */
export const GET = unifiedApiHandler(async (request, { module }) => {
  const result = await module.jobs.listJobs();

  if (!result.success) {
    return errorResponse(result.error || 'Failed to list jobs', 500);
  }

  const response: JobListResponse = {
    jobs: result.data,
  };
  return okResponse(response);
});

/**
 * POST /api/workspaces/staff/jobs/control
 * Control a background job (pause/resume/trigger)
 */
export const POST = unifiedApiHandler(async (request, { module }) => {
  const body: JobControlRequest = await request.json();
  const { jobId, action } = body;
  if (!jobId || !action) {
    return errorResponse("Missing jobId or action");
  }

  let result: { success: boolean, message?: string, error?: string };

  switch (action) {
    case 'pause':
      result = await module.jobs.pauseJob(jobId);
      break;
    case 'resume':
      result = await module.jobs.resumeJob(jobId);
      break;
    case 'trigger':
      result = await module.jobs.triggerJob(jobId);
      break;
    default:
      return errorResponse("Invalid action. Must be: pause, resume, or trigger");
  }

  if (!result.success) {
    return serverErrorResponse(result.error || 'Operation failed');
  }

  // Fetch updated job info
  const updatedJobsResult = await module.jobs.listJobs();
  const updatedJob = updatedJobsResult.success ? updatedJobsResult.data.find(j => j.id === jobId) : undefined;

  const response: JobControlResponse = {
    success: true,
    message: result.message || 'Success',
    job: updatedJob,
  };
  return okResponse(response);
});
