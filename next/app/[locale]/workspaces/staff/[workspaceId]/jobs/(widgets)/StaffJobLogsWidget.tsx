'use client';

// ═══════════════════════════════════════════════════════════════
// STAFF JOB LOGS WIDGET
// ═══════════════════════════════════════════════════════════════
// Widget for viewing and filtering background job logs
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect } from 'react';
import type { JobLog, LogJobType, LogStatus, JobLogsResponse } from '@/lib/domain/jobs/jobs.types';
import { FiFilter, FiSearch, FiChevronDown, FiChevronRight, FiRefreshCw } from 'react-icons/fi';
import { fetchJobLogs } from '@/lib/utils/http/StaffJobsApiHelper';
import { GlobalLoaderTile } from '@/app/[locale]/(global)/(tiles)/GlobalLoaderTile';

export function StaffJobLogsWidget() {
  const [logs, setLogs] = useState<JobLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedLogId, setExpandedLogId] = useState<number | null>(null);

  // Filters
  const [selectedJobTypes, setSelectedJobTypes] = useState<LogJobType[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<LogStatus[]>([]);
  const [timeRange, setTimeRange] = useState('24h');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const limit = 50;

  useEffect(() => {
    fetchLogs();
  }, [selectedJobTypes, selectedStatuses, timeRange, page]);

  const fetchLogs = async () => {
    try {
      setLoading(true);

      // Calculate time range
      const endTime = new Date();
      const startTime = new Date();
      switch (timeRange) {
        case '1h':
          startTime.setHours(startTime.getHours() - 1);
          break;
        case '24h':
          startTime.setDate(startTime.getDate() - 1);
          break;
        case '7d':
          startTime.setDate(startTime.getDate() - 7);
          break;
        case '30d':
          startTime.setDate(startTime.getDate() - 30);
          break;
      }

      const data = await fetchJobLogs({
        jobType: selectedJobTypes.length > 0 ? selectedJobTypes : undefined,
        status: selectedStatuses.length > 0 ? selectedStatuses : undefined,
        correlationId: searchTerm || undefined,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        limit,
        offset: page * limit,
      });

      setLogs(data.logs);
      setHasMore(data.hasMore);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load logs');
    } finally {
      setLoading(false);
    }
  };

  const toggleJobType = (type: LogJobType) => {
    setSelectedJobTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
    setPage(0);
  };

  const toggleStatus = (status: LogStatus) => {
    setSelectedStatuses(prev =>
      prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
    );
    setPage(0);
  };

  const handleSearch = () => {
    setPage(0);
    fetchLogs();
  };

  const formatDuration = (ms?: number) => {
    if (!ms) return 'N/A';
    if (ms < 1000) return `${Math.round(ms)}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const getStatusBadge = (status: LogStatus) => {
    const classes = {
      completed: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      started: 'bg-blue-100 text-blue-800',
    };
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${classes[status]}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-900">Job Logs</h2>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center gap-2 mb-4">
          <FiFilter className="text-gray-600" />
          <h3 className="font-semibold text-gray-900">Filters</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Job Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Job Type</label>
            <div className="space-y-1">
              {(['scanner', 'worker', 'topic-scanner', 'topic-worker'] as LogJobType[]).map(type => (
                <label key={type} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedJobTypes.includes(type)}
                    onChange={() => toggleJobType(type)}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-700">{type}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <div className="space-y-1">
              {(['completed', 'failed', 'started'] as LogStatus[]).map(status => (
                <label key={status} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedStatuses.includes(status)}
                    onChange={() => toggleStatus(status)}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-700">{status}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Time Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Time Range</label>
            <select
              value={timeRange}
              onChange={(e) => { setTimeRange(e.target.value); setPage(0); }}
              className="w-full rounded border-gray-300 shadow-sm"
            >
              <option value="1h">Last Hour</option>
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
            </select>
          </div>
        </div>

        {/* Search */}
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Search by Correlation ID
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Enter correlation ID..."
              className="flex-1 rounded border-gray-300 shadow-sm"
            />
            <button
              onClick={handleSearch}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2"
            >
              <FiSearch /> Search
            </button>
            <button
              onClick={fetchLogs}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 flex items-center gap-2"
            >
              <FiRefreshCw /> Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <GlobalLoaderTile message="Loading logs..." />
        ) : error ? (
          <div className="p-8 text-center text-red-600">{error}</div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center text-gray-600">No logs found</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-8"></th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Timestamp</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Job Type</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Correlation ID</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {logs.map((log, index) => (
                    <>
                      <tr
                        key={index}
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => setExpandedLogId(expandedLogId === index ? null : index)}
                      >
                        <td className="px-4 py-3">
                          {expandedLogId === index ? (
                            <FiChevronDown className="text-gray-600" />
                          ) : (
                            <FiChevronRight className="text-gray-600" />
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {new Date(log.timestamp).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{log.jobType}</td>
                        <td className="px-4 py-3">{getStatusBadge(log.status)}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{formatDuration(log.duration)}</td>
                        <td className="px-4 py-3 text-sm text-gray-500 font-mono text-xs">
                          {log.correlationId.substring(0, 8)}...
                        </td>
                      </tr>
                      {expandedLogId === index && (
                        <tr>
                          <td colSpan={6} className="px-4 py-4 bg-gray-50">
                            <div className="space-y-2">
                              <div>
                                <span className="font-semibold text-sm">Full Correlation ID:</span>
                                <code className="ml-2 text-xs bg-gray-100 px-2 py-1 rounded">{log.correlationId}</code>
                              </div>
                              {Object.keys(log.metadata).length > 0 && (
                                <div>
                                  <span className="font-semibold text-sm">Metadata:</span>
                                  <pre className="mt-2 text-xs bg-gray-100 p-3 rounded overflow-x-auto">
                                    {JSON.stringify(log.metadata, null, 2)}
                                  </pre>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-4 py-3 bg-gray-50 border-t flex items-center justify-between">
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-4 py-2 border rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
              >
                Previous
              </button>
              <span className="text-sm text-gray-600">Page {page + 1}</span>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={!hasMore}
                className="px-4 py-2 border rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
              >
                Next
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
