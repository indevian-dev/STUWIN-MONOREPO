"use client";

import {
  useState,
  useEffect
} from 'react';
import { StudentQuestionListItemWidget } from './StudentQuestionListItemWidget';
import { toast } from 'react-toastify';
import { apiCallForSpaHelper } from '@/lib/helpers/apiCallForSpaHelper';
import { useTranslations } from 'next-intl';

import { ConsoleLogger } from '@/lib/app-infrastructure/loggers/ConsoleLogger';
import { GlobalLoaderTile } from '@/app/[locale]/(global)/(tiles)/GlobalLoaderTile';
interface Question {
  id: string;
  body: string;
  answers: string[] | string;
  correct_answer: string;
  published_data?: {
    is_active: boolean;
  };
  subject_id?: string;
  subject_title?: string;
  grade_level?: number;
  complexity?: string;
  created_at?: string;
}

export function StudentQuestionsListWidget() {
  const t = useTranslations('Questions');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 0,
    pageSize: 20
  });

  useEffect(() => {
    fetchQuestions();
  }, [page]);

  const fetchQuestions = async () => {
    setLoading(true);

    const params = new URLSearchParams({
      page: page.toString(),
      pageSize: pagination.pageSize.toString()
    });

    const response = await apiCallForSpaHelper({
      method: 'GET',
      url: `/api/workspaces/dashboard/questions?${params.toString()}`,
    });

    if (response.status === 200) {
      setQuestions(response.data.questions);
      setPagination({
        total: response.data.total,
        totalPages: response.data.totalPages,
        pageSize: response.data.pageSize
      });
    } else {
      ConsoleLogger.error('Error fetching questions:', response.statusText);
      toast.error('Error fetching questions');
    }
    setLoading(false);
  };

  const handleQuestionUpdate = (updatedQuestion: Question) => {
    setQuestions(prevQuestions =>
      prevQuestions.map(q =>
        q.id === updatedQuestion.id ? updatedQuestion : q
      )
    );
  };

  return (
    <div className='w-full'>
      {/* Loading State */}
      {loading && <GlobalLoaderTile message="Loading questions..." />}

      {/* Questions List */}
      {!loading && (
        <div className='space-y-4'>
          {questions.length === 0 ? (
            <div className='text-center py-12 bg-white rounded-lg border border-gray-200'>
              <p className='text-gray-500'>{t('no_questions_found')}</p>
              <p className='text-sm text-gray-400 mt-2'>
                {t('create_first_question')}
              </p>
            </div>
          ) : (
            questions.map((question) => (
              <StudentQuestionListItemWidget
                key={question.id}
                question={question}
                onUpdate={handleQuestionUpdate}
              />
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

