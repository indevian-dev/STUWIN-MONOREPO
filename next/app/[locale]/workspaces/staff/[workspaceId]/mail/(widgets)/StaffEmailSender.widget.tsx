'use client'

import { useState } from 'react'
import {
  PiPaperPlaneTilt,
  PiFileText
} from 'react-icons/pi'

interface EmailResult {
  message_id: string
  status: string
}

export function StaffEmailSenderWidget() {
  const [formData, setFormData] = useState({
    to_email: '',
    to_name: '',
    subject: '',
    htmlbody: '',
    textbody: '',
    template_id: ''
  })
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<EmailResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSendEmail = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSending(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch('/api/workspaces/staff/mail/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (response.ok) {
        setResult(data)
        // Reset form on success
        setFormData({
          to_email: '',
          to_name: '',
          subject: '',
          htmlbody: '',
          textbody: '',
          template_id: ''
        })
      } else {
        setError(data.error || 'Failed to send email')
      }
    } catch (err) {
      setError('Network error occurred')
    } finally {
      setSending(false)
    }
  }

  const loadTemplate = () => {
    // Sample template for testing
    setFormData(prev => ({
      ...prev,
      subject: 'Test Email from ZeptoMail',
      htmlbody: `
        <html>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #2563eb;">Hello ${prev.to_name || 'there'}!</h2>
              <p>This is a test email sent from your ZeptoMail integration.</p>
              <p>If you're receiving this email, your ZeptoMail configuration is working correctly.</p>
              <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <p style="margin: 0;"><strong>Email sent at:</strong> ${new Date().toLocaleString()}</p>
              </div>
              <p>Best regards,<br>Your Application Team</p>
            </div>
          </body>
        </html>
      `,
      textbody: `Hello ${prev.to_name || 'there'}!\n\nThis is a test email sent from your ZeptoMail integration.\n\nIf you're receiving this email, your ZeptoMail configuration is working correctly.\n\nEmail sent at: ${new Date().toLocaleString()}\n\nBest regards,\nYour Application Team`
    }))
  }

  return (
    <div className="space-y-6">
      {/* Send Email Form */}
      <div className="bg-white rounded-app shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Send Test Email</h3>
          <button
            type="button"
            onClick={loadTemplate}
            className="flex items-center px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-app hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-app focus:ring-offset-2"
          >
            <PiFileText className="h-4 w-4 mr-1" />
            Load Template
          </button>
        </div>

        <form onSubmit={handleSendEmail} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="to_email" className="block text-sm font-medium text-gray-700 mb-1">
                Recipient Email *
              </label>
              <input
                type="email"
                id="to_email"
                name="to_email"
                value={formData.to_email}
                onChange={handleInputChange}
                required
                className="block w-full px-3 py-2 border border-gray-300 rounded-app shadow-sm focus:outline-none focus:ring-app focus:border-app"
                placeholder="recipient@example.com"
              />
            </div>

            <div>
              <label htmlFor="to_name" className="block text-sm font-medium text-gray-700 mb-1">
                Recipient Name
              </label>
              <input
                type="text"
                id="to_name"
                name="to_name"
                value={formData.to_name}
                onChange={handleInputChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-app shadow-sm focus:outline-none focus:ring-app focus:border-app"
                placeholder="John Doe"
              />
            </div>
          </div>

          <div>
            <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
              Subject *
            </label>
            <input
              type="text"
              id="subject"
              name="subject"
              value={formData.subject}
              onChange={handleInputChange}
              required
              className="block w-full px-3 py-2 border border-gray-300 rounded-app shadow-sm focus:outline-none focus:ring-app focus:border-app"
              placeholder="Email subject"
            />
          </div>

          <div>
            <label htmlFor="htmlbody" className="block text-sm font-medium text-gray-700 mb-1">
              HTML Body *
            </label>
            <textarea
              id="htmlbody"
              name="htmlbody"
              value={formData.htmlbody}
              onChange={handleInputChange}
              required
              rows={8}
              className="block w-full px-3 py-2 border border-gray-300 rounded-app shadow-sm focus:outline-none focus:ring-app focus:border-app font-mono text-sm"
              placeholder="<html><body><h1>Hello World!</h1></body></html>"
            />
          </div>

          <div>
            <label htmlFor="textbody" className="block text-sm font-medium text-gray-700 mb-1">
              Text Body (Optional)
            </label>
            <textarea
              id="textbody"
              name="textbody"
              value={formData.textbody}
              onChange={handleInputChange}
              rows={4}
              className="block w-full px-3 py-2 border border-gray-300 rounded-app shadow-sm focus:outline-none focus:ring-app focus:border-app"
              placeholder="Plain text version of your email"
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={sending}
              className="flex items-center px-4 py-2 bg-app-bright-green text-white rounded-app hover:bg-app-bright-green/90 focus:outline-none focus:ring-2 focus:ring-app focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <PiPaperPlaneTilt className="h-4 w-4 mr-2" />
              {sending ? 'Sending...' : 'Send Email'}
            </button>
          </div>
        </form>
      </div>

      {/* Result Display */}
      {result && (
        <div className="bg-white rounded-app shadow p-6">
          <h3 className="text-lg font-medium text-emerald-600 mb-4">Email Sent Successfully!</h3>
          <div className="bg-emerald-50 p-4 rounded-app">
            <div className="space-y-2 text-sm">
              <div><strong>Message ID:</strong> {result.message_id}</div>
              <div><strong>Status:</strong> {result.status}</div>
              <div><strong>Sent At:</strong> {new Date().toLocaleString()}</div>
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-white rounded-app shadow p-6">
          <h3 className="text-lg font-medium text-rose-600 mb-4">Error Sending Email</h3>
          <div className="bg-rose-50 p-4 rounded-app">
            <div className="text-sm text-rose-700">{error}</div>
          </div>
        </div>
      )}
    </div>
  )
}
