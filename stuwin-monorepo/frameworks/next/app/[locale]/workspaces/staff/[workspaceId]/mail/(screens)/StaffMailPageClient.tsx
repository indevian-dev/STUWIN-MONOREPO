'use client'

import { useState } from 'react'
import { StaffPageTitleTile } from '@/app/[locale]/workspaces/staff/[workspaceId]/(tiles)/StaffPageTitleTile'
import { StaffMailServiceStatusWidget } from '@/app/[locale]/workspaces/staff/[workspaceId]/mail/(widgets)/StaffMailServiceStatusWidget'
import { StaffEmailSenderWidget } from '@/app/[locale]/workspaces/staff/[workspaceId]/mail/(widgets)/StaffEmailSenderWidget'
import { StaffMailConfigurationWidget } from '@/app/[locale]/workspaces/staff/[workspaceId]/mail/(widgets)/StaffMailConfigurationWidget'

export default function StaffMailPageClient() {
  const [activeTab, setActiveTab] = useState('status')

  return (
    <div className="min-h-screen bg-light">
      <StaffPageTitleTile pageTitle="ZeptoMail Management" />

      <div className="p-6">
        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('status')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'status'
                  ? 'border-brand text-brand'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                Service Status
              </button>
              <button
                onClick={() => setActiveTab('sender')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'sender'
                  ? 'border-brand text-brand'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                Send Email
              </button>
              <button
                onClick={() => setActiveTab('config')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'config'
                  ? 'border-brand text-brand'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                Configuration
              </button>
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'status' && <StaffMailServiceStatusWidget />}
        {activeTab === 'sender' && <StaffEmailSenderWidget />}
        {activeTab === 'config' && <StaffMailConfigurationWidget />}
      </div>
    </div>
  )
}


