// ═══════════════════════════════════════════════════════════════
// STAFF JOBS CONTROL API
// ═══════════════════════════════════════════════════════════════
// API for managing background job schedules
// Pause, resume, trigger, and list jobs
// ═══════════════════════════════════════════════════════════════
import { NextResponse } from 'next/server';
import { unifiedApiHandler } from '@/lib/app-access-control/interceptors';
import type {
  JobControlRequest,
  JobControlResponse,
  JobListResponse,
} from '@/types/resources/backgroundJobs';

/**
 * GET /api/workspaces/staff/jobs/control
 * List all background jobs with their current status
 */
export const GET = unifiedApiHandler(async (request, { module }) => {
  const result = await module.jobs.listJobs();

  if (!result.data) {
    return NextResponse.json({ error: 'Failed to list jobs' }, { status: 500 });
  }

  const response: JobListResponse = {
    jobs: result.data,
  };
  return NextResponse.json(response);
});

/**
 * POST /api/workspaces/staff/jobs/control
 * Control a background job (pause/resume/trigger)
 */
export const POST = unifiedApiHandler(async (request, { module }) => {
  const body: JobControlRequest = await request.json();
  const { jobId, action } = body;
  if (!jobId || !action) {
    return NextResponse.json(
      { error: 'Missing jobId or action' },
      { status: 400 }
    );
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
      return NextResponse.json(
        { error: 'Invalid action. Must be: pause, resume, or trigger' },
        { status: 400 }
      );
  }

  if (!result.success) {
    return NextResponse.json(
      { success: false, message: result.error || 'Operation failed' } as JobControlResponse,
      { status: 500 }
    );
  }

  // Fetch updated job info
  const updatedJobsResult = await module.jobs.listJobs();
  const updatedJob = updatedJobsResult.data?.find(j => j.id === jobId);

  const response: JobControlResponse = {
    success: true,
    message: result.message || 'Success',
    job: updatedJob,
  };
  return NextResponse.json(response);
});
