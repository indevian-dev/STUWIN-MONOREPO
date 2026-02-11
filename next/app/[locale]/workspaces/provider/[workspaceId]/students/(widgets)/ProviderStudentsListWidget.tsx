'use client'

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import {
  PiUser,
  PiEnvelope,
  PiPhone,
  PiCalendar,
  PiEye,
  PiTrash,
  PiArrowLeft,
  PiArrowRight
} from 'react-icons/pi';
import type { User } from '@/types/domain';

interface ProviderStudentsListWidgetProps {
  students: User.Profile[];
  onDelete: (studentId: string | number) => void;
  onRefresh: () => void;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function ProviderStudentsListWidget({
  students,
  onDelete,
  onRefresh,
  currentPage,
  totalPages,
  onPageChange
}: ProviderStudentsListWidgetProps) {
  const params = useParams();
  const workspaceId = params.workspaceId as string;
  const t = useTranslations('ProviderStudents');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredStudents = students.filter(student =>
    student.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-neutral-200">
      {/* Search and Filters */}
      <div className="p-4 border-b border-neutral-200">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder={t('search_students')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
            />
          </div>
          <button
            onClick={onRefresh}
            className="px-4 py-2 bg-neutral-100 text-neutral-700 rounded-md hover:bg-neutral-200 transition-colors"
          >
            {t('refresh')}
          </button>
        </div>
      </div>

      {/* Students List */}
      <div className="divide-y divide-neutral-200">
        {filteredStudents.length === 0 ? (
          <div className="p-8 text-center">
            <PiUser className="mx-auto h-12 w-12 text-neutral-400 mb-4" />
            <p className="text-neutral-600">
              {students.length === 0 ? t('no_students_found') : t('no_students_match_search')}
            </p>
          </div>
        ) : (
          filteredStudents.map((student) => (
            <div key={student.id} className="p-4 hover:bg-neutral-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-brand/10 rounded-full flex items-center justify-center">
                      <PiUser className="w-6 h-6 text-brand" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-medium text-dark">
                        {student.fullName || t('unnamed_student')}
                      </h3>
                      <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                        {t('active')}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-sm text-neutral-600">
                      <div className="flex items-center gap-1">
                        <PiEnvelope className="w-4 h-4" />
                        {student.email || t('no_email')}
                      </div>
                      {student.phone && (
                        <div className="flex items-center gap-1">
                          <PiPhone className="w-4 h-4" />
                          {student.phone}
                        </div>
                      )}
                      {student.createdAt && (
                        <div className="flex items-center gap-1">
                          <PiCalendar className="w-4 h-4" />
                          {t('joined')} {formatDate(student.createdAt)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/workspaces/provider/${workspaceId}/students/${student.id}`}
                    className="p-2 text-neutral-600 hover:text-brand hover:bg-brand/10 rounded-md transition-colors"
                    title={t('view_student')}
                  >
                    <PiEye className="w-5 h-5" />
                  </Link>
                  <button
                    onClick={() => onDelete(student.id)}
                    className="p-2 text-neutral-600 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                    title={t('delete_student')}
                  >
                    <PiTrash className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-4 py-3 border-t border-neutral-200 flex items-center justify-between">
          <div className="text-sm text-neutral-600">
            {t('page')} {currentPage} {t('of')} {totalPages}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-2 text-neutral-600 hover:text-brand disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <PiArrowLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-2 text-neutral-600 hover:text-brand disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <PiArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}




