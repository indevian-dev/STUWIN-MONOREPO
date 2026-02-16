"use client";

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Link } from '@/i18n/routing';
import { toast } from 'react-toastify';
import { apiCallForSpaHelper } from '@/lib/utils/http/SpaApiClient';
import { useTranslations } from 'next-intl';
import { GlobalLoaderTile } from '@/app/[locale]/(global)/(tiles)/GlobalLoaderTile';

import { ConsoleLogger } from '@/lib/logging/ConsoleLogger';
interface Quiz {
  id: number;
  subjectTitle?: string;
  status: 'completed' | 'in_progress' | 'abandoned' | null;
  createdAt: string;
  totalQuestions: number;
  gradeLevel?: number;
  complexity?: string;
  score?: number | null;
  correctAnswers?: number;
}

interface Pagination {
  total: number;
  totalPages: number;
  pageSize: number;
}

export function StudentQuizHistoryListWidget() {
  const params = useParams();
  const workspaceId = params.workspaceId as string;
  const t = useTranslations('Quiz');
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [page, setPage] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    totalPages: 0,
    pageSize: 20
  });

  const fetchQuizzes = useCallback(async () => {
    setLoading(true);

    const searchParams = new URLSearchParams({
      page: page.toString(),
      pageSize: pagination.pageSize.toString()
    });

    const response = await apiCallForSpaHelper({
      method: 'GET',
      url: `/api/workspaces/student/${workspaceId}/quizzes/history?${searchParams.toString()}`,
    });

    if (response.status === 200) {
      const payload = response.data?.data;
      setQuizzes(payload?.quizzes ?? []);
      setPagination({
        total: payload?.total ?? 0,
        totalPages: payload?.totalPages ?? 0,
        pageSize: payload?.pageSize ?? 20
      });
    } else {
      ConsoleLogger.error('Error fetching quiz history:', response.data?.error || response.statusText);
      toast.error('Error fetching quiz history');
    }
    setLoading(false);
  }, [page, pagination.pageSize, workspaceId]);

  useEffect(() => {
    fetchQuizzes();
  }, [fetchQuizzes]);

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: Quiz['status']): string => {
    if (!status) return 'bg-gray-100 text-gray-800';

    const badges: Record<NonNullable<Quiz['status']>, string> = {
      completed: 'bg-green-100 text-green-800',
      in_progress: 'bg-yellow-100 text-yellow-800',
      abandoned: 'bg-red-100 text-red-800'
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className='w-full'>
      <Link
        href={`/workspaces/student/${workspaceId}/quizzes/start`}
        className='px-6 py-2 bg-brand text-white font-semibold rounded-md hover:bg-brand-dark transition-colors'
      >
        Start New Quiz
      </Link>
      {/* Loading State */}
      {loading && <GlobalLoaderTile message="Loading quiz history..." />}

      {/* Quizzes List */}
      {!loading && (
        <div className='space-y-4'>
          {quizzes.length === 0 ? (
            <div className='text-center py-12 bg-white rounded-lg border border-gray-200'>
              <p className='text-gray-500'>No quizzes found</p>
              <p className='text-sm text-gray-400 mt-2'>
                Take your first quiz to see it here!
              </p>
              <Link
                href={`/workspaces/student/${workspaceId}/quizzes/start`}
                className='inline-block mt-4 px-6 py-2 bg-brand text-white font-semibold rounded-md hover:bg-brand-dark transition-colors'
              >
                Start Quiz
              </Link>
            </div>
          ) : (
            quizzes.map((quiz) => (
              <div
                key={quiz.id}
                className='bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow'
              >
                <div className='flex flex-col md:flex-row md:items-center md:justify-between'>
                  {/* Quiz Info */}
                  <div className='flex-1'>
                    <div className='flex items-center gap-3 mb-2'>
                      <h3 className='text-lg font-semibold text-gray-800'>
                        {quiz.subjectTitle || 'Mixed Subjects'}
                      </h3>
                      {quiz.status && typeof quiz.status === 'string' && (
                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusBadge(quiz.status)}`}>
                          {quiz.status.replace('_', ' ').toUpperCase()}
                        </span>
                      )}
                    </div>

                    <div className='flex flex-wrap gap-4 text-sm text-gray-600 mb-2'>
                      <span>
                        📅 {formatDate(quiz.createdAt)}
                      </span>
                      <span>
                        📝 {quiz.totalQuestions} questions
                      </span>
                      {quiz.gradeLevel && (
                        <span>
                          🎓 Grade {quiz.gradeLevel}
                        </span>
                      )}
                      {quiz.complexity && (
                        <span>
                          ⚡ {quiz.complexity.charAt(0).toUpperCase() + quiz.complexity.slice(1)}
                        </span>
                      )}
                    </div>

                    {/* Score Display */}
                    {quiz.status === 'completed' && quiz.score !== null && quiz.score !== undefined && (
                      <div className='flex items-center gap-4 mt-3'>
                        <div className='flex items-center'>
                          <span className='text-sm text-gray-600 mr-2'>Score:</span>
                          <span className={`text-2xl font-bold ${(quiz.score ?? 0) >= 70 ? 'text-green-600' : 'text-red-600'
                            }`}>
                            {(quiz.score ?? 0).toFixed(0)}%
                          </span>
                        </div>
                        <div className='text-sm text-gray-600'>
                          {quiz.correctAnswers} / {quiz.totalQuestions} correct
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action Button */}
                  <div className='mt-4 md:mt-0'>
                    {quiz.status === 'completed' ? (
                      <Link
                        href={`/workspaces/student/${workspaceId}/quizzes/results/${quiz.id}`}
                        className='inline-block px-6 py-2 bg-brand text-white font-semibold rounded-md hover:bg-brand-dark transition-colors'
                      >
                        View Results
                      </Link>
                    ) : quiz.status === 'in_progress' ? (
                      <Link
                        href={`/workspaces/student/${workspaceId}/quizzes/take/${quiz.id}`}
                        className='inline-block px-6 py-2 bg-yellow-500 text-white font-semibold rounded-md hover:bg-yellow-600 transition-colors'
                      >
                        Continue
                      </Link>
                    ) : quiz.status === 'abandoned' ? (
                      <span className='text-gray-400'>Abandoned</span>
                    ) : (
                      <span className='text-gray-400'>Unknown</span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Pagination */}
      {!loading && pagination.totalPages > 1 && (
        <div className='mt-6 flex justify-center items-center space-x-2'>
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className='px-4 py-2 bg-white border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50'
          >
            Previous
          </button>
          <span className='px-4 py-2 text-gray-700'>
            Page {page} of {pagination.totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
            disabled={page === pagination.totalPages}
            className='px-4 py-2 bg-white border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50'
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

