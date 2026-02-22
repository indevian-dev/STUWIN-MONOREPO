'use client'

import {
  useState,
  useEffect
} from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { fetchApiUtil } from '@/lib/utils/Http.FetchApiSPA.util';
import { toast } from 'react-toastify';
import { PiArrowLeft, PiPencil } from 'react-icons/pi';
import { Link } from '@/i18n/routing';
import { ProviderStudentDetailWidget } from './(widgets)/ProviderStudentDetail.widget';
import type { UserPrivateAccess } from '@/lib/domain/auth/Auth.types';

import { ConsoleLogger } from '@/lib/logging/Console.logger';
import { GlobalLoaderTile } from '@/app/[locale]/(global)/(tiles)/GlobalLoader.tile';
interface ProviderStudentDetailPageClientProps {
  studentId: string;
}

export default function ProviderStudentDetailPageClient({
  studentId
}: ProviderStudentDetailPageClientProps) {
  const [student, setStudent] = useState<UserPrivateAccess | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const params = useParams();
  const workspaceId = params.workspaceId as string;
  const t = useTranslations('ProviderStudents');


  const fetchStudent = async () => {
    try {
      setLoading(true);
      const response = await fetchApiUtil<any>({
        method: 'GET',
        url: `/api/workspaces/provider/${workspaceId}/students/${studentId}`,
      });

      setStudent(response.student);
    } catch (error) {
      ConsoleLogger.error('Error fetching student:', error);
      toast.error(t('error_loading_student'));
      router.push(`/workspaces/provider/${workspaceId}/students`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudent();
  }, [studentId]);



  if (loading) return <GlobalLoaderTile />;

  if (!student) {
    return (
      <div className="text-center py-12">
        <p className="text-neutral-600">{t('student_not_found')}</p>
        <Link
          href={`/workspaces/provider/${workspaceId}/students`}
          className="inline-flex items-center gap-2 mt-4 text-app-bright-green hover:underline"
        >
          <PiArrowLeft className="w-4 h-4" />
          {t('back_to_students')}
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link
            href={`/workspaces/provider/${workspaceId}/students`}
            className="p-2 text-neutral-600 hover:text-app-bright-green hover:bg-app-bright-green/10 rounded-app transition-colors"
          >
            <PiArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-app-dark-blue dark:text-white">
              {student.fullName || t('unnamed_student')}
            </h1>
            <p className="text-neutral-600 mt-1">
              {t('student_details')}
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <Link
            href={`/workspaces/provider/${workspaceId}/progress/${studentId}`}
            className="px-4 py-2 bg-blue-600 text-white rounded-app-primary hover:bg-blue-700 transition-colors"
          >
            {t('view_progress')}
          </Link>
          <button className="flex items-center gap-2 px-4 py-2 bg-app-bright-green text-white rounded-app-primary hover:bg-app-bright-green/80 transition-colors">
            <PiPencil className="w-4 h-4" />
            {t('edit_student')}
          </button>
        </div>
      </div>

      <ProviderStudentDetailWidget
        student={student}
      />
    </div>
  );
}




