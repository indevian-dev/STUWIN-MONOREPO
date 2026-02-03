'use client'

import {
  useState,
  useEffect
} from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { apiCallForSpaHelper } from '@/lib/helpers/apiCallForSpaHelper';
import { toast } from 'react-toastify';
import { Link } from '@/i18n/routing';
import { PiPlusCircle, PiEnvelope } from 'react-icons/pi';
import { ProviderStudentsListWidget } from './(widgets)/ProviderStudentsListWidget';
import type { User } from '@/types/resources';

import { ConsoleLogger } from '@/lib/app-infrastructure/loggers/ConsoleLogger';
import { GlobalLoaderTile } from '@/app/[locale]/(global)/(tiles)/GlobalLoaderTile';
export default function ProviderStudentsPageClient() {
  const [students, setStudents] = useState<import('@/types').User.Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const router = useRouter();
  const params = useParams();
  const workspaceId = params.workspaceId as string;
  const t = useTranslations('ProviderStudents');
  const limit = 20;

  useEffect(() => {
    fetchStudents();
  }, [page]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await apiCallForSpaHelper({
        method: 'GET',
        url: `/api/workspaces/provider/${workspaceId}/students?page=${page}&limit=${limit}`,
      });

      if (response.status === 200) {
        setStudents(response.data.students || []);
        setTotalPages(response.data.totalPages || 1);
      } else {
        toast.error(t('error_loading_students'));
      }
    } catch (error) {
      ConsoleLogger.error('Error fetching students:', error);
      toast.error(t('error_loading_students'));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (studentId: string | number) => {
    if (!window.confirm(t('confirm_delete_student'))) return;

    try {
      const response = await apiCallForSpaHelper({
        method: 'DELETE',
        url: `/api/workspaces/provider/${workspaceId}/students/delete/${studentId}`,
      });

      if (response.status === 200) {
        toast.success(t('student_deleted'));
        fetchStudents();
      } else {
        toast.error(t('error_deleting_student'));
      }
    } catch (error) {
      ConsoleLogger.error('Error deleting student:', error);
      toast.error(t('error_deleting_student'));
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-dark">
            {t('students')}
          </h1>
          <p className="text-neutral-600 mt-1">
            {t('manage_organization_students')}
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href={`/workspaces/provider/${workspaceId}/students/invite`}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-primary hover:bg-green-700 transition-colors"
          >
            <PiEnvelope className="text-lg" />
            {t('invite_students')}
          </Link>
          <Link
            href={`/workspaces/provider/${workspaceId}/students/create`}
            className="flex items-center gap-2 bg-brand text-white px-4 py-2 rounded-primary hover:bg-brand/80 transition-colors"
          >
            <PiPlusCircle className="text-lg" />
            {t('add_student')}
          </Link>
        </div>
      </div>

      {loading ? <GlobalLoaderTile /> : (
        <ProviderStudentsListWidget
          students={students}
          onDelete={handleDelete}
          onRefresh={fetchStudents}
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}




