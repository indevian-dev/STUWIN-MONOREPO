"use client";

import { ProviderAIQuestionGeneratorWidget } from '@/app/[locale]/workspaces/provider/[workspaceId]/questions/(widgets)/ProviderAIQuestionGeneratorWidget';
import { StaffPageTitleTile } from '@/app/[locale]/workspaces/staff/[workspaceId]/(tiles)/StaffPageTitleTile';
import { useRouter } from 'next/navigation';
import { Link } from '@/i18n/routing';

import { ConsoleLogger } from '@/lib/app-infrastructure/loggers/ConsoleLogger';
export default function ProviderGenerateQuestionsPageClient() {
  const router = useRouter();

  const handleQuestionsGenerated = (questions: any[]) => {
    ConsoleLogger.log('Generated questions:', questions);
  };

  const handleCancel = () => {
    router.push('/provider/questions');
  };

  return (
    <div className='w-full min-h-screen bg-gray-50 p-6'>
      <div className='max-w-4xl mx-auto'>
        {/* Page Header */}
        <div className='mb-6'>
          <div className='flex items-center gap-2 mb-4'>
            <Link 
              href='/provider/questions'
              className='text-blue-600 hover:text-blue-700'
            >
              ← Back to Questions
            </Link>
          </div>
          <StaffPageTitleTile pageTitle='Generate Questions with AI' />
          <p className='mt-2 text-gray-600'>
            Use AI to automatically generate questions based on subject, grade level, and topic
          </p>
        </div>

        {/* AI Generator Widget */}
        <ProviderAIQuestionGeneratorWidget 
          onQuestionGenerated={handleQuestionsGenerated}
          onCancel={handleCancel}
        />

        {/* Info Box */}
        <div className='mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200'>
          <h4 className='font-semibold text-blue-900 mb-2'>How AI Generation Works</h4>
          <ul className='text-sm text-blue-800 space-y-1'>
            <li>• Select the subject, grade level, and complexity</li>
            <li>• Specify a topic (e.g., "Photosynthesis" or "Fractions")</li>
            <li>• Choose how many questions to generate (1-10)</li>
            <li>• AI will create educational questions with 4 answer options</li>
            <li>• Generated questions are automatically saved to the database</li>
            <li>• Review and edit questions as needed</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

