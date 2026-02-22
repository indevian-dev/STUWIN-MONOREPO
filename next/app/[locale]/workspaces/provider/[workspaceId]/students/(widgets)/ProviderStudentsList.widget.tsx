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
import type { User } from '@stuwin/shared/types/domain/Domain.types';
import { Card } from '@/app/primitives/Card.primitive';

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
    <Card className="bg-white/80 dark:bg-white/5 border-black/10 dark:border-white/10 overflow-hidden p-0">
      {/* Search bar */}
      <div className="p-4 border-b border-black/10 dark:border-white/10 flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder={t('search_students')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 px-3 py-2 rounded-app outline-none transition-colors
            border border-black/10 dark:border-white/10
            bg-white dark:bg-white/5
            text-app-dark-blue dark:text-white
            placeholder:text-app-dark-blue/30 dark:placeholder:text-white/30
            focus:border-app-bright-green dark:focus:border-app-bright-green"
        />
        <button
          onClick={onRefresh}
          className="px-4 py-2 rounded-app text-sm font-medium transition-colors
            bg-black/5 dark:bg-white/10
            text-app-dark-blue dark:text-white
            hover:bg-black/10 dark:hover:bg-white/20"
        >
          {t('refresh')}
        </button>
      </div>

      {/* Students list */}
      <div className="divide-y divide-black/5 dark:divide-white/5">
        {filteredStudents.length === 0 ? (
          <div className="p-10 flex flex-col items-center gap-3 text-center">
            <PiUser className="h-12 w-12 text-app-dark-blue/20 dark:text-white/20" />
            <p className="text-app-dark-blue/50 dark:text-white/50">
              {students.length === 0 ? t('no_students_found') : t('no_students_match_search')}
            </p>
          </div>
        ) : (
          filteredStudents.map((student) => (
            <div
              key={student.id}
              className="p-4 flex items-center justify-between gap-4
                hover:bg-black/2 dark:hover:bg-white/5 transition-colors"
            >
              {/* Left: avatar + info */}
              <div className="flex items-center gap-4 min-w-0">
                <div className="shrink-0 w-12 h-12 rounded-app-full flex items-center justify-center
                  bg-app-bright-green/10">
                  <PiUser className="w-6 h-6 text-app-bright-green" />
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-semibold text-app-dark-blue dark:text-white truncate">
                      {student.fullName || t('unnamed_student')}
                    </h3>
                    <span className="px-2 py-0.5 text-xs font-semibold rounded-app-full
                      bg-app-bright-green/10 dark:bg-app-bright-green/20 text-app-bright-green">
                      {t('active')}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm
                    text-app-dark-blue/50 dark:text-white/50">
                    <span className="flex items-center gap-1">
                      <PiEnvelope className="w-4 h-4" />
                      {student.email || t('no_email')}
                    </span>
                    {student.phone && (
                      <span className="flex items-center gap-1">
                        <PiPhone className="w-4 h-4" />
                        {student.phone}
                      </span>
                    )}
                    {student.createdAt && (
                      <span className="flex items-center gap-1">
                        <PiCalendar className="w-4 h-4" />
                        {t('joined')} {formatDate(student.createdAt)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Right: actions */}
              <div className="flex items-center gap-1 shrink-0">
                <Link
                  href={`/workspaces/provider/${workspaceId}/students/${student.id}`}
                  className="p-2 rounded-app transition-colors
                    text-app-dark-blue/40 dark:text-white/40
                    hover:text-app-bright-green hover:bg-app-bright-green/10"
                  title={t('view_student')}
                >
                  <PiEye className="w-5 h-5" />
                </Link>
                <button
                  onClick={() => onDelete(student.id)}
                  className="p-2 rounded-app transition-colors
                    text-app-dark-blue/40 dark:text-white/40
                    hover:text-red-500 hover:bg-red-500/10"
                  title={t('delete_student')}
                >
                  <PiTrash className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-4 py-3 border-t border-black/10 dark:border-white/10 flex items-center justify-between">
          <span className="text-sm text-app-dark-blue/50 dark:text-white/50">
            {t('page')} {currentPage} {t('of')} {totalPages}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-2 rounded-app transition-colors
                text-app-dark-blue/50 dark:text-white/50
                hover:text-app-bright-green hover:bg-app-bright-green/10
                disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <PiArrowLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-2 rounded-app transition-colors
                text-app-dark-blue/50 dark:text-white/50
                hover:text-app-bright-green hover:bg-app-bright-green/10
                disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <PiArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </Card>
  );
}
