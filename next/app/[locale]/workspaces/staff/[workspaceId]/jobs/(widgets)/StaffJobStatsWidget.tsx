'use client';

// ═══════════════════════════════════════════════════════════════
// STAFF JOB STATISTICS WIDGET
// ═══════════════════════════════════════════════════════════════
// Widget displaying aggregated statistics for background jobs
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect } from 'react';
import type { JobStatsResponse } from '@/lib/domain/jobs/jobs.types';
import { FiActivity, FiCheckCircle, FiClock, FiLayers } from 'react-icons/fi';
import { fetchJobStats } from '@/lib/utils/http/StaffJobsApiHelper';
import { GlobalLoaderTile } from '@/app/[locale]/(global)/(tiles)/GlobalLoaderTile';

export function StaffJobStatsWidget() {
  const [stats, setStats] = useState<JobStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
    // Refresh every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const data = await fetchJobStats();
      setStats(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load statistics');
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  if (loading && !stats) {
    return <GlobalLoaderTile />;
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center text-red-600">
          <p>{error}</p>
          <button
            onClick={fetchStats}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Statistics</h2>

      {/* Report Generation Stats */}
      <div>
        <h3 className="text-lg font-semibold text-gray-700 mb-3">Student Report Generation</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <FiActivity className="text-blue-600 text-xl" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Runs</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.overview.reportGeneration.totalRuns}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <FiCheckCircle className="text-green-600 text-xl" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Success Rate</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatPercentage(stats.overview.reportGeneration.successRate)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 rounded-lg">
                <FiClock className="text-purple-600 text-xl" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Avg Duration</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatDuration(stats.overview.reportGeneration.avgProcessingTime)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-orange-100 rounded-lg">
                <FiLayers className="text-orange-600 text-xl" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Last Run</p>
                <p className="text-sm font-semibold text-gray-900">
                  {stats.overview.reportGeneration.lastRun
                    ? new Date(stats.overview.reportGeneration.lastRun).toLocaleDateString()
                    : 'Never'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Question Generation Stats */}
      <div>
        <h3 className="text-lg font-semibold text-gray-700 mb-3">Topic Question Generation</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <FiActivity className="text-blue-600 text-xl" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Runs</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.overview.questionGeneration.totalRuns}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <FiCheckCircle className="text-green-600 text-xl" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Success Rate</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatPercentage(stats.overview.questionGeneration.successRate)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 rounded-lg">
                <FiClock className="text-purple-600 text-xl" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Avg Duration</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatDuration(stats.overview.questionGeneration.avgProcessingTime)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-orange-100 rounded-lg">
                <FiLayers className="text-orange-600 text-xl" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Last Run</p>
                <p className="text-sm font-semibold text-gray-900">
                  {stats.overview.questionGeneration.lastRun
                    ? new Date(stats.overview.questionGeneration.lastRun).toLocaleDateString()
                    : 'Never'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      {stats.recentActivity.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-700 mb-3">Recent Activity (Last 24h)</h3>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="max-h-64 overflow-y-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Job Type</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {stats.recentActivity.map((activity, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {new Date(activity.timestamp).toLocaleTimeString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{activity.jobType}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${activity.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : activity.status === 'failed'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-blue-100 text-blue-800'
                            }`}
                        >
                          {activity.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {activity.duration ? formatDuration(activity.duration) : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
