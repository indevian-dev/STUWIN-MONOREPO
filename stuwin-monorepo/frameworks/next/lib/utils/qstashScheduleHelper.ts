// ═══════════════════════════════════════════════════════════════
// QSTASH SCHEDULE MANAGEMENT HELPER
// ═══════════════════════════════════════════════════════════════
// Helper functions for managing QStash schedules via API
// ═══════════════════════════════════════════════════════════════

import type { QStashSchedule, BackgroundJob, JobType } from '@/lib/app-core-modules/jobs/jobs.types';
import { qstashClient } from '@/lib/integrations/qstashClient';

import { ConsoleLogger } from '@/lib/app-infrastructure/loggers/ConsoleLogger';
const QSTASH_API_URL = 'https://qstash.upstash.io/v2';
const QSTASH_TOKEN = process.env.QSTASH_TOKEN;

// Build base URL with proper scheme
function getBaseUrl(): string {
  // Priority: NGROK_URL (for local dev) -> NEXT_PUBLIC_APP_URL (for prod) -> localhost (fallback)
  const domain = process.env.NGROK_URL || process.env.NEXT_PUBLIC_APP_URL || 'localhost:3033';

  // Check if domain already has a scheme
  if (domain.startsWith('http://') || domain.startsWith('https://')) {
    return domain;
  }

  // Add https:// for production domains, http:// for localhost
  return domain.includes('localhost') ? `http://${domain}` : `https://${domain}`;
}

// Job definitions
export const JOB_DEFINITIONS: Record<JobType, Omit<BackgroundJob, 'id' | 'status' | 'nextRun' | 'lastRun'>> = {
  'report-scanner': {
    name: 'Student Report Generation',
    description: 'Generates weekly AI-powered reports for students',
    type: 'report-scanner',
    schedule: '0 0 * * 0', // Weekly on Sundays at midnight
    scheduleDescription: 'Weekly (Sundays at 00:00 UTC)',
    endpoint: `${getBaseUrl()}/api/workspaces/jobs/mass-report-scanner?lastId=0`,
  },
  'topic-scanner': {
    name: 'Topic Question Generation',
    description: 'Automatically generates questions for topics below capacity',
    type: 'topic-scanner',
    schedule: '0 * * * *', // Hourly
    scheduleDescription: 'Hourly (at minute 0)',
    endpoint: `${getBaseUrl()}/api/workspaces/jobs/topic-question-scanner?lastId=0`,
  },
};

/**
 * Make authenticated request to QStash API
 */
async function qstashRequest(endpoint: string, options: RequestInit = {}) {
  if (!QSTASH_TOKEN) {
    throw new Error('QSTASH_TOKEN is not configured');
  }

  const response = await fetch(`${QSTASH_API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${QSTASH_TOKEN}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`QStash API error: ${response.status} ${errorText}`);
  }

  // Handle empty responses
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

/**
 * List all QStash schedules
 */
export async function listSchedules(): Promise<QStashSchedule[]> {
  try {
    const schedules = await qstashRequest('/schedules');
    return schedules || [];
  } catch (error) {
    ConsoleLogger.error('Failed to list schedules:', error);
    return [];
  }
}

/**
 * Get schedule by destination URL
 */
export async function findScheduleByEndpoint(endpoint: string): Promise<QStashSchedule | null> {
  const schedules = await listSchedules();
  return schedules.find(s => s.destination === endpoint) || null;
}

/**
 * Pause a schedule
 */
export async function pauseSchedule(scheduleId: string): Promise<void> {
  await qstashRequest(`/schedules/${scheduleId}/pause`, {
    method: 'POST',
  });
}

/**
 * Resume a schedule
 */
export async function resumeSchedule(scheduleId: string): Promise<void> {
  await qstashRequest(`/schedules/${scheduleId}/resume`, {
    method: 'POST',
  });
}

/**
 * Create a new schedule
 */
export async function createSchedule(params: {
  cron: string;
  destination: string;
  method?: string;
  body?: string;
  retries?: number;
}): Promise<QStashSchedule> {
  return await qstashRequest('/schedules', {
    method: 'POST',
    body: JSON.stringify({
      cron: params.cron,
      destination: params.destination,
      method: params.method || 'POST',
      body: params.body || '{}',
      retries: params.retries || 3,
    }),
  });
}

/**
 * Delete a schedule
 */
export async function deleteSchedule(scheduleId: string): Promise<void> {
  await qstashRequest(`/schedules/${scheduleId}`, {
    method: 'DELETE',
  });
}

/**
 * Manually trigger a job by publishing a message
 */
export async function triggerJob(endpoint: string): Promise<any> {
  // Ensure endpoint has proper scheme
  let url = endpoint;
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = url.includes('localhost') ? `http://${url}` : `https://${url}`;
  }

  ConsoleLogger.log('Triggering job with URL:', url);

  try {
    // Use QStash client library instead of raw API call
    const result = await qstashClient.publishJSON({
      url: url,
      body: {},
      retries: 3,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    ConsoleLogger.log('QStash publish result:', result);
    return result;
  } catch (error) {
    ConsoleLogger.error('QStash publish error:', error);
    throw error;
  }
}

/**
 * Get all background jobs with their current status
 */
export async function getAllJobs(): Promise<BackgroundJob[]> {
  const schedules = await listSchedules();
  const jobs: BackgroundJob[] = [];

  for (const [jobType, definition] of Object.entries(JOB_DEFINITIONS)) {
    ConsoleLogger.log(`Job ${jobType} endpoint:`, definition.endpoint);

    const schedule = schedules.find(s => s.destination === definition.endpoint);

    let status: BackgroundJob['status'] = 'unknown';
    let scheduleId = '';

    if (schedule) {
      status = schedule.paused ? 'paused' : 'active';
      scheduleId = schedule.scheduleId;
    }

    jobs.push({
      ...definition,
      id: scheduleId || `missing-${jobType}`,
      status,
      nextRun: schedule && !schedule.paused ? calculateNextRun(definition.schedule) : null,
    });
  }

  return jobs;
}

/**
 * Calculate next run time from cron expression (simplified)
 */
function calculateNextRun(cronExpression: string): Date {
  const now = new Date();

  // Simple cron parsing for our specific cases
  if (cronExpression === '0 0 * * 0') {
    // Weekly on Sunday at midnight
    const nextSunday = new Date(now);
    nextSunday.setDate(now.getDate() + ((7 - now.getDay()) % 7 || 7));
    nextSunday.setHours(0, 0, 0, 0);
    return nextSunday;
  } else if (cronExpression === '0 * * * *') {
    // Hourly at minute 0
    const nextHour = new Date(now);
    nextHour.setMinutes(0, 0, 0);
    if (nextHour <= now) {
      nextHour.setHours(nextHour.getHours() + 1);
    }
    return nextHour;
  }

  // Default: next hour
  const nextRun = new Date(now);
  nextRun.setHours(nextRun.getHours() + 1);
  return nextRun;
}

/**
 * Get human-readable status description
 */
export function getJobStatusDescription(status: BackgroundJob['status']): string {
  switch (status) {
    case 'active':
      return 'Active - Running on schedule';
    case 'paused':
      return 'Paused - Not running';
    case 'running':
      return 'Currently processing';
    case 'unknown':
      return 'Not configured';
    default:
      return 'Unknown status';
  }
}
