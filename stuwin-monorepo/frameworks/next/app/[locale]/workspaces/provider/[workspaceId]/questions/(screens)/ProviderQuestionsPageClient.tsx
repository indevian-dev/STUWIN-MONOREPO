"use client";

import { ProviderQuestionsListWidget } from '@/app/[locale]/workspaces/provider/[workspaceId]/questions/(widgets)/ProviderQuestionsListWidget';
import { StaffPageTitleTile } from '@/app/[locale]/workspaces/staff/[workspaceId]/(tiles)/StaffPageTitleTile';
import { Link } from '@/i18n/routing';
import { useTranslations } from 'next-intl';

export default function ProviderQuestionsPageClient() {
  const t = useTranslations('Questions');

  return (
    <div className='w-full min-h-screen bg-gray-50 p-6'>
      <div className='max-w-7xl mx-auto'>
        {/* Page Header */}
        <div className='mb-6'>
          <StaffPageTitleTile pageTitle='Questions Management' />
          <p className='mt-2 text-gray-600'>
            Create, edit, and manage questions for your platform
          </p>
        </div>

        {/* Action Buttons */}
        <div className='mb-6 flex gap-3'>
          <Link
            href='/provider/questions/create'
            className='px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium inline-flex items-center'
          >
            <svg 
              className="w-5 h-5 mr-2" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 4v16m8-8H4" 
              />
            </svg>
            Create Question Manually
          </Link>

          <Link
            href='/provider/questions/generate'
            className='px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors font-medium inline-flex items-center'
          >
            <svg 
              className="w-5 h-5 mr-2" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M13 10V3L4 14h7v7l9-11h-7z" 
              />
            </svg>
            Generate with AI
          </Link>
        </div>

        {/* Questions List */}
        <ProviderQuestionsListWidget />
      </div>
    </div>
  );
}

