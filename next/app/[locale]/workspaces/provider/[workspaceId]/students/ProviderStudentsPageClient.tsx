'use client'

import {
  useState,
  useEffect
} from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { fetchApiUtil } from '@/lib/utils/Http.FetchApiSPA.util';
import { toast } from 'react-toastify';
import { Link } from '@/i18n/routing';
import { PiPlusCircle, PiEnvelope } from 'react-icons/pi';
import { ProviderStudentsListWidget } from './(widgets)/ProviderStudentsList.widget';

import { ConsoleLogger } from '@/lib/logging/Console.logger';
import { GlobalLoaderTile } from '@/app/[locale]/(global)/(tiles)/GlobalLoader.tile';
import { User } from '@stuwin/shared/types/domain/User.types';
export default function ProviderStudentsPageClient() {
  const [students, setStudents] = useState<User.Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const params = useParams();
  const workspaceId = params.workspaceId as string;
  const t = useTranslations('ProviderStudents');
  const limit = 20;


  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await fetchApiUtil<any>({
        method: 'GET',
        url: `/api/workspaces/provider/${workspaceId}/students?page=${page}&limit=${limit}`,
      });

      setStudents(response.students || []);
      setTotalPages(response.totalPages || 1);
    } catch (error) {
      ConsoleLogger.error('Error fetching students:', error);
      toast.error(t('error_loading_students'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [page]);



  const handleDelete = async (studentId: string | number) => {
    if (!window.confirm(t('confirm_delete_student'))) return;

    try {
      const response = await fetchApiUtil<any>({
        method: 'DELETE',
        url: `/api/workspaces/provider/${workspaceId}/students/delete/${studentId}`,
      });

      toast.success(t('student_deleted'));
      fetchStudents();
    } catch (error) {
      ConsoleLogger.error('Error deleting student:', error);
      toast.error(t('error_deleting_student'));
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-app-dark-blue dark:text-white">
            {t('students')}
          </h1>
          <p className="text-neutral-600 mt-1">
            {t('manage_organization_students')}
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href={`/workspaces/provider/${workspaceId}/students/invite`}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-app-primary hover:bg-green-700 transition-colors"
          >
            <PiEnvelope className="text-lg" />
            {t('invite_students')}
          </Link>
          <Link
            href={`/workspaces/provider/${workspaceId}/students/create`}
            className="flex items-center gap-2 bg-app-bright-green text-white px-4 py-2 rounded-app-primary hover:bg-app-bright-green/80 transition-colors"
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




