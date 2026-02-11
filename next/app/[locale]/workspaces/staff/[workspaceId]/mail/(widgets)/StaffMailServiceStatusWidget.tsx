'use client'

import {
  useState,
  useEffect
} from 'react'
import {
  PiCheckCircle,
  PiXCircle,
  PiExclamationMarkLight,
  PiClock,
  PiArrowArcLeft
} from 'react-icons/pi'
import { GlobalLoaderTile } from '@/app/[locale]/(global)/(tiles)/GlobalLoaderTile';

interface ServiceStatus {
  status: 'operational' | 'degraded' | 'down' | 'unknown';
  message: string;
  api_configured: boolean;
  smtp_configured: boolean;
  mail_agent: string;
}

export function StaffMailServiceStatusWidget() {
  const [status, setStatus] = useState<ServiceStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const fetchServiceStatus = async () => {
    try {
      setRefreshing(true)
      const response = await fetch('/api/workspaces/staff/mail/status')
      const data = await response.json()

      if (response.ok) {
        setStatus(data)
        setError(null)
      } else {
        setError(data.error || 'Failed to fetch service status')
      }

      setLastUpdated(new Date())
    } catch (err) {
      setError('Network error occurred')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchServiceStatus()

    // Auto-refresh every 60 seconds
    const interval = setInterval(fetchServiceStatus, 60000)
    return () => clearInterval(interval)
  }, [])

  const getStatusIcon = (status: string | undefined) => {
    switch (status) {
      case 'operational':
        return <PiCheckCircle className="h-6 w-6 text-emerald-500" />
      case 'degraded':
        return <PiExclamationMarkLight className="h-6 w-6 text-yellow-500" />
      case 'down':
        return <PiXCircle className="h-6 w-6 text-rose-500" />
      default:
        return <PiClock className="h-6 w-6 text-gray-500" />
    }
  }

  const getStatusColor = (status: string | undefined) => {
    switch (status) {
      case 'operational':
        return 'text-emerald-600 bg-emerald-50 border-emerald-200'
      case 'degraded':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'down':
        return 'text-rose-600 bg-rose-50 border-rose-200'
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  if (loading) {
    return <GlobalLoaderTile />
  }

  return (
    <div className="space-y-6">
      {/* Service Status Overview */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">ZeptoMail Service Status</h3>
          <button
            onClick={fetchServiceStatus}
            disabled={refreshing}
            className="flex items-center px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 disabled:opacity-50"
          >
            <PiArrowArcLeft className={`h-4 w-4 mr-1 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {error ? (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-md">
            <div className="flex items-center">
              <PiXCircle className="h-5 w-5 text-rose-500 mr-2" />
              <span className="text-rose-700">{error}</span>
            </div>
          </div>
        ) : (
          <div className={`p-4 border rounded-md ${getStatusColor(status?.status)}`}>
            <div className="flex items-center">
              {getStatusIcon(status?.status)}
              <div className="ml-3">
                <h4 className="font-medium capitalize">
                  {status?.status || 'Unknown'}
                </h4>
                <p className="text-sm">
                  {status?.message || 'Service status information'}
                </p>
              </div>
            </div>
          </div>
        )}

        {lastUpdated && (
          <p className="text-xs text-gray-500 mt-2">
            Last updated: {lastUpdated.toLocaleString()}
          </p>
        )}
      </div>

      {/* Configuration Status */}
      {status && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Configuration Status</h3>

          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">API Key Configured</span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.api_configured
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-rose-100 text-rose-800'
                }`}>
                {status.api_configured ? 'Yes' : 'No'}
              </span>
            </div>

            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">SMTP Configured</span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.smtp_configured
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-rose-100 text-rose-800'
                }`}>
                {status.smtp_configured ? 'Yes' : 'No'}
              </span>
            </div>

            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Mail Agent</span>
              <span className="text-sm text-gray-600">
                {status.mail_agent || 'Not configured'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Service Information */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Service Information</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-sm font-medium text-blue-600 mb-1">Max Email Size</div>
            <div className="text-lg font-bold text-blue-800">15 MB</div>
            <div className="text-xs text-blue-600">Including headers, body, and attachments</div>
          </div>

          <div className="bg-emerald-50 p-4 rounded-lg">
            <div className="text-sm font-medium text-emerald-600 mb-1">Email Type</div>
            <div className="text-lg font-bold text-emerald-800">Transactional</div>
            <div className="text-xs text-emerald-600">OTP, notifications, confirmations</div>
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="text-sm font-medium text-yellow-600 mb-1">Security</div>
            <div className="text-lg font-bold text-yellow-800">TLS v1.2</div>
            <div className="text-xs text-yellow-600">Encrypted data transfer</div>
          </div>

          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="text-sm font-medium text-purple-600 mb-1">API Version</div>
            <div className="text-lg font-bold text-purple-800">v1.1</div>
            <div className="text-xs text-purple-600">Latest stable version</div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a
            href="https://zeptomail.zoho.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2"
          >
            Open ZeptoMail Dashboard
          </a>

          <a
            href="https://www.zoho.com/zeptomail/help/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2"
          >
            View Documentation
          </a>

          <button
            onClick={() => window.location.reload()}
            className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2"
          >
            Refresh Page
          </button>
        </div>
      </div>
    </div>
  )
}