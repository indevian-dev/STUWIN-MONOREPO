'use client';

// ═══════════════════════════════════════════════════════════════
// STAFF JOB CONTROL WIDGET
// ═══════════════════════════════════════════════════════════════
// Widget for controlling background jobs (pause/resume/trigger)
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect } from 'react';
import type { BackgroundJob, JobControlRequest } from '@/lib/domain/jobs/jobs.types';
import { FiPlay, FiPause, FiZap, FiClock, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import { fetchJobs, controlJob } from '@/lib/utils/http/StaffJobsApiHelper';

export function StaffJobControlWidget() {
  const [jobs, setJobs] = useState<BackgroundJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Fetch jobs on mount
  useEffect(() => {
    fetchJobsList();
  }, []);

  const fetchJobsList = async () => {
    try {
      setLoading(true);
      const data = await fetchJobs();
      setJobs(data.jobs);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  const handleJobAction = async (jobId: string, action: JobControlRequest['action']) => {
    try {
      setActionLoading(`${jobId}-${action}`);

      await controlJob({ jobId, action });

      // Refresh jobs list
      await fetchJobsList();
    } catch (err) {
      alert(`Failed to ${action} job: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: BackgroundJob['status']) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm font-medium">
            <FiCheckCircle className="text-green-600" />
            Active
          </span>
        );
      case 'paused':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-yellow-100 text-yellow-700 text-sm font-medium">
            <FiPause className="text-yellow-600" />
            Paused
          </span>
        );
      case 'running':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm font-medium">
            <FiZap className="text-blue-600 animate-pulse" />
            Running
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-sm font-medium">
            <FiAlertCircle className="text-gray-600" />
            Unknown
          </span>
        );
    }
  };

  const formatNextRun = (nextRun: Date | null) => {
    if (!nextRun) return 'Not scheduled';

    const date = new Date(nextRun);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="h-24 bg-gray-200 rounded"></div>
          <div className="h-24 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center text-red-600">
          <FiAlertCircle className="mx-auto text-4xl mb-2" />
          <p>{error}</p>
          <button
            onClick={fetchJobsList}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Job Control</h2>
        <button
          onClick={fetchJobsList}
          className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition"
        >
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {jobs.map((job) => (
          <div
            key={job.id}
            className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{job.name}</h3>
                <p className="text-sm text-gray-600 mt-1">{job.description}</p>
              </div>
              {getStatusBadge(job.status)}
            </div>

            <div className="space-y-2 mb-4 text-sm">
              <div className="flex items-center gap-2 text-gray-700">
                <FiClock className="text-gray-400" />
                <span className="font-medium">Schedule:</span>
                <span>{job.scheduleDescription}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <FiZap className="text-gray-400" />
                <span className="font-medium">Next Run:</span>
                <span>{formatNextRun(job.nextRun)}</span>
              </div>
            </div>

            <div className="flex gap-2">
              {job.status === 'active' ? (
                <button
                  onClick={() => handleJobAction(job.id, 'pause')}
                  disabled={actionLoading === `${job.id}-pause`}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FiPause />
                  {actionLoading === `${job.id}-pause` ? 'Pausing...' : 'Pause'}
                </button>
              ) : job.status === 'paused' ? (
                <button
                  onClick={() => handleJobAction(job.id, 'resume')}
                  disabled={actionLoading === `${job.id}-resume`}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FiPlay />
                  {actionLoading === `${job.id}-resume` ? 'Resuming...' : 'Resume'}
                </button>
              ) : null}

              <button
                onClick={() => handleJobAction(job.id, 'trigger')}
                disabled={actionLoading === `${job.id}-trigger`}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FiZap />
                {actionLoading === `${job.id}-trigger` ? 'Triggering...' : 'Trigger Now'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
