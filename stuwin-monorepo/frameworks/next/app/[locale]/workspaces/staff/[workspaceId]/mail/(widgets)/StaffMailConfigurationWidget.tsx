'use client'

import { ConsoleLogger } from '@/lib/app-infrastructure/loggers/ConsoleLogger';

import {
  useState,
  useEffect
} from 'react'
import {
  PiEye,
  PiEyeSlash,
  PiCheckCircle,
  PiXCircle
} from 'react-icons/pi'

export function StaffMailConfigurationWidget() {
  const [config, setConfig] = useState({
    api_key: '',
    smtp_host: 'smtp.zeptomail.com',
    smtp_port: '587',
    smtp_username: 'emailapikey',
    smtp_password: '',
    from_email: '',
    from_name: ''
  })
  const [showApiKey, setShowApiKey] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchConfiguration()
  }, [])

  const fetchConfiguration = async () => {
    try {
      const response = await fetch('/api/workspaces/staff/mail/config')
      const data = await response.json()

      if (response.ok) {
        setConfig(prev => ({ ...prev, ...data.config }))
      }
    } catch (err) {
      ConsoleLogger.error('Failed to fetch configuration:', err)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setConfig(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSaveConfiguration = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch('/api/workspaces/staff/mail/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config)
      })

      const data = await response.json()

      if (response.ok) {
        setResult('Configuration saved successfully!')
      } else {
        setError(data.error || 'Failed to save configuration')
      }
    } catch (err) {
      setError('Network error occurred')
    } finally {
      setSaving(false)
    }
  }

  const handleTestConnection = async () => {
    setTesting(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch('/api/workspaces/staff/mail/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config)
      })

      const data = await response.json()

      if (response.ok) {
        setResult('Connection test successful!')
      } else {
        setError(data.error || 'Connection test failed')
      }
    } catch (err) {
      setError('Network error occurred')
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Configuration Form */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">ZeptoMail Configuration</h3>

        <form onSubmit={handleSaveConfiguration} className="space-y-6">
          {/* API Configuration */}
          <div>
            <h4 className="text-md font-medium text-gray-800 mb-3">API Configuration</h4>
            <div className="space-y-4">
              <div>
                <label htmlFor="api_key" className="block text-sm font-medium text-gray-700 mb-1">
                  API Key *
                </label>
                <div className="relative">
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    id="api_key"
                    name="api_key"
                    value={config.api_key}
                    onChange={handleInputChange}
                    required
                    className="block w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand focus:border-brand"
                    placeholder="Your ZeptoMail API key"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showApiKey ? (
                      <PiEyeSlash className="h-4 w-4 text-gray-400" />
                    ) : (
                      <PiEye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="from_email" className="block text-sm font-medium text-gray-700 mb-1">
                    From Email *
                  </label>
                  <input
                    type="email"
                    id="from_email"
                    name="from_email"
                    value={config.from_email}
                    onChange={handleInputChange}
                    required
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand focus:border-brand"
                    placeholder="noreply@yourdomain.com"
                  />
                </div>

                <div>
                  <label htmlFor="from_name" className="block text-sm font-medium text-gray-700 mb-1">
                    From Name
                  </label>
                  <input
                    type="text"
                    id="from_name"
                    name="from_name"
                    value={config.from_name}
                    onChange={handleInputChange}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand focus:border-brand"
                    placeholder="Your App Name"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SMTP Configuration */}
          <div>
            <h4 className="text-md font-medium text-gray-800 mb-3">SMTP Configuration</h4>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="smtp_host" className="block text-sm font-medium text-gray-700 mb-1">
                    SMTP Host
                  </label>
                  <input
                    type="text"
                    id="smtp_host"
                    name="smtp_host"
                    value={config.smtp_host}
                    onChange={handleInputChange}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand focus:border-brand"
                    readOnly
                  />
                </div>

                <div>
                  <label htmlFor="smtp_port" className="block text-sm font-medium text-gray-700 mb-1">
                    SMTP Port
                  </label>
                  <select
                    id="smtp_port"
                    name="smtp_port"
                    value={config.smtp_port}
                    onChange={handleInputChange}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand focus:border-brand"
                  >
                    <option value="587">587 (TLS)</option>
                    <option value="465">465 (SSL)</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="smtp_username" className="block text-sm font-medium text-gray-700 mb-1">
                    SMTP Username
                  </label>
                  <input
                    type="text"
                    id="smtp_username"
                    name="smtp_username"
                    value={config.smtp_username}
                    onChange={handleInputChange}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand focus:border-brand"
                    readOnly
                  />
                </div>
              </div>

              <div>
                <label htmlFor="smtp_password" className="block text-sm font-medium text-gray-700 mb-1">
                  SMTP Password *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="smtp_password"
                    name="smtp_password"
                    value={config.smtp_password}
                    onChange={handleInputChange}
                    required
                    className="block w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand focus:border-brand"
                    placeholder="Your ZeptoMail SMTP password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPassword ? (
                      <PiEyeSlash className="h-4 w-4 text-gray-400" />
                    ) : (
                      <PiEye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-4">
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-brand text-white rounded-md hover:bg-brand/90 focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Configuration'}
            </button>

            <button
              type="button"
              onClick={handleTestConnection}
              disabled={testing || !config.api_key}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {testing ? 'Testing...' : 'Test Connection'}
            </button>
          </div>
        </form>
      </div>

      {/* Result/Error Display */}
      {result && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center text-emerald-600">
            <PiCheckCircle className="h-5 w-5 mr-2" />
            <span className="font-medium">{result}</span>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center text-rose-600">
            <PiXCircle className="h-5 w-5 mr-2" />
            <span className="font-medium">{error}</span>
          </div>
        </div>
      )}

      {/* Configuration Help */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Configuration Help</h3>

        <div className="space-y-4 text-sm text-gray-600">
          <div>
            <h4 className="font-medium text-gray-800">Getting your API Key:</h4>
            <ol className="list-decimal list-inside mt-1 space-y-1">
              <li>Login to your ZeptoMail account</li>
              <li>Navigate to your Mail Agent</li>
              <li>Go to Setup Info → API tab</li>
              <li>Copy the API key</li>
            </ol>
          </div>

          <div>
            <h4 className="font-medium text-gray-800">Getting your SMTP Password:</h4>
            <ol className="list-decimal list-inside mt-1 space-y-1">
              <li>Login to your ZeptoMail account</li>
              <li>Navigate to your Mail Agent</li>
              <li>Go to Setup Info → SMTP tab</li>
              <li>Copy the password</li>
            </ol>
          </div>

          <div className="bg-yellow-50 p-3 rounded-md">
            <p className="text-yellow-800">
              <strong>Note:</strong> Make sure your domain is verified in ZeptoMail before sending emails.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}