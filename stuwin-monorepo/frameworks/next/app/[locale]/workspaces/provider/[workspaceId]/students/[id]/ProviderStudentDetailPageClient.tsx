'use client'

import {
  useState,
  useEffect
} from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { apiCallForSpaHelper } from '@/lib/helpers/apiCallForSpaHelper';
import { toast } from 'react-toastify';
import { PiArrowLeft, PiPencil } from 'react-icons/pi';
import { Link } from '@/i18n/routing';
import { ProviderStudentDetailWidget } from './(widgets)/ProviderStudentDetailWidget';
import type { User } from '@/types/resources';

import { ConsoleLogger } from '@/lib/app-infrastructure/loggers/ConsoleLogger';
import { GlobalLoaderTile } from '@/app/[locale]/(global)/(tiles)/GlobalLoaderTile';
interface ProviderStudentDetailPageClientProps {
  studentId: string;
}

export default function ProviderStudentDetailPageClient({
  studentId
}: ProviderStudentDetailPageClientProps) {
  const [student, setStudent] = useState<User.PrivateAccess | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const params = useParams();
  const workspaceId = params.workspaceId as string;
  const t = useTranslations('ProviderStudents');

  useEffect(() => {
    fetchStudent();
  }, [studentId]);

  const fetchStudent = async () => {
    try {
      setLoading(true);
      const response = await apiCallForSpaHelper({
        method: 'GET',
        url: `/api/workspaces/provider/${workspaceId}/students/${studentId}`,
      });

      if (response.status === 200) {
        setStudent(response.data.student);
      } else {
        toast.error(t('error_loading_student'));
        router.push(`/workspaces/provider/${workspaceId}/students`);
      }
    } catch (error) {
      ConsoleLogger.error('Error fetching student:', error);
      toast.error(t('error_loading_student'));
      router.push(`/workspaces/provider/${workspaceId}/students`);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <GlobalLoaderTile />;

  if (!student) {
    return (
      <div className="text-center py-12">
        <p className="text-neutral-600">{t('student_not_found')}</p>
        <Link
          href={`/workspaces/provider/${workspaceId}/students`}
          className="inline-flex items-center gap-2 mt-4 text-brand hover:underline"
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
            className="p-2 text-neutral-600 hover:text-brand hover:bg-brand/10 rounded-md transition-colors"
          >
            <PiArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-dark">
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
            className="px-4 py-2 bg-blue-600 text-white rounded-primary hover:bg-blue-700 transition-colors"
          >
            {t('view_progress')}
          </Link>
          <button className="flex items-center gap-2 px-4 py-2 bg-brand text-white rounded-primary hover:bg-brand/80 transition-colors">
            <PiPencil className="w-4 h-4" />
            {t('edit_student')}
          </button>
        </div>
      </div>

      <ProviderStudentDetailWidget
        student={student}
        onUpdate={fetchStudent}
      />
    </div>
  );
}




