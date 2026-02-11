"use client";

import { ProviderQuestionFormWidget } from '@/app/[locale]/workspaces/provider/[workspaceId]/questions/(widgets)/ProviderQuestionFormWidget';
import { StaffPageTitleTile } from '@/app/[locale]/workspaces/staff/[workspaceId]/(tiles)/StaffPageTitleTile';
import { useRouter } from 'next/navigation';
import { Link } from '@/i18n/routing';

export default function ProviderCreateQuestionPageClient() {
  const router = useRouter();

  const handleSuccess = (question: any) => {
    router.push('/provider/questions');
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
          <StaffPageTitleTile pageTitle='Create New Question' />
          <p className='mt-2 text-gray-600'>
            Manually create a new question with answers
          </p>
        </div>

        {/* Question Form */}
        <ProviderQuestionFormWidget 
          mode='create'
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
}

