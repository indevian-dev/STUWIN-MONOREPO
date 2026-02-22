'use client'

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { fetchApiUtil } from '@/lib/utils/Http.FetchApiSPA.util';
import { toast } from 'react-toastify';
import { PiArrowLeft } from 'react-icons/pi';
import { Link } from '@/i18n/routing';
import { ProviderCreateStudentWidget } from './(widgets)/ProviderCreateStudent.widget';

import { ConsoleLogger } from '@/lib/logging/Console.logger';
export default function ProviderCreateStudentPageClient() {
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const params = useParams();
  const workspaceId = params.workspaceId as string;
  const t = useTranslations('ProviderStudents');

  const handleCreate = async (studentData: any) => {
    try {
      setSaving(true);
      const response = await fetchApiUtil<any>({
        method: 'POST',
        url: `/api/workspaces/provider/${workspaceId}/students/create`,
        body: studentData,
      });

      if (response.status === 201) {
        toast.success(t('student_created_successfully'));
        router.push(`/workspaces/provider/${workspaceId}/students`);
      } else {
        toast.error(t('error_creating_student'));
      }
    } catch (error) {
      ConsoleLogger.error('Error creating student:', error);
      toast.error(t('error_creating_student'));
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    router.push(`/workspaces/provider/${workspaceId}/students`);
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center gap-4 mb-6">
        <Link
          href={`/workspaces/provider/${workspaceId}/students`}
          className="p-2 text-neutral-600 hover:text-app-bright-green hover:bg-app-bright-green/10 rounded-app transition-colors"
        >
          <PiArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-app-dark-blue dark:text-white">
            {t('create_new_student')}
          </h1>
          <p className="text-neutral-600 mt-1">
            {t('add_new_student_description')}
          </p>
        </div>
      </div>

      <ProviderCreateStudentWidget
        onCreate={handleCreate}
        onCancel={handleCancel}
        saving={saving}
      />
    </div>
  );
}




