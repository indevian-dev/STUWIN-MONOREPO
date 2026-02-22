'use client'

import { useState } from 'react'
import { StaffPageTitleTile } from '@/app/[locale]/workspaces/staff/[workspaceId]/(tiles)/StaffPageTitle.tile'
import { StaffMailServiceStatusWidget } from '@/app/[locale]/workspaces/staff/[workspaceId]/mail/(widgets)/StaffMailServiceStatus.widget'
import { StaffEmailSenderWidget } from '@/app/[locale]/workspaces/staff/[workspaceId]/mail/(widgets)/StaffEmailSender.widget'
import { StaffMailConfigurationWidget } from '@/app/[locale]/workspaces/staff/[workspaceId]/mail/(widgets)/StaffMailConfiguration.widget'

export default function StaffMailPageClient() {
  const [activeTab, setActiveTab] = useState('status')

  return (
    <div className="min-h-screen bg-app-bright-green-light">
      <StaffPageTitleTile pageTitle="ZeptoMail Management" />

      <div className="p-6">
        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('status')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'status'
                  ? 'border-app text-app-bright-green'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                Service Status
              </button>
              <button
                onClick={() => setActiveTab('sender')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'sender'
                  ? 'border-app text-app-bright-green'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                Send Email
              </button>
              <button
                onClick={() => setActiveTab('config')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'config'
                  ? 'border-app text-app-bright-green'
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


