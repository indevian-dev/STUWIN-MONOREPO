"use client";

import {
  useState,
  useEffect
} from 'react';
import { useParams } from 'next/navigation';
import { ProviderQuestionsFiltersWidget } from '@/app/[locale]/workspaces/provider/[workspaceId]/questions/(widgets)/ProviderQuestionsFiltersWidget';
import { ProviderQuestionListItemWidget } from '@/app/[locale]/workspaces/provider/[workspaceId]/questions/(widgets)/ProviderQuestionListItemWidget';
import { toast } from 'react-toastify';
import { apiCallForSpaHelper } from '@/lib/helpers/apiCallForSpaHelper';
import {
  Question
} from '@/types/resources/questions';
import { Question as QuestionType } from '@/types/resources/questions';
import { ApiResponse } from '@/types';

import { ConsoleLogger } from '@/lib/app-infrastructure/loggers/ConsoleLogger';
interface PaginationState {
  total: number;
  totalPages: number;
  pageSize: number;
}

export function ProviderQuestionsListWidget() {
  const params = useParams();
  const workspaceId = params.workspaceId as string;
  const [questions, setQuestions] = useState<QuestionType.PrivateAccess[]>([]);
  const [page, setPage] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [filters, setFilters] = useState<QuestionType.QuestionFilters>({});
  const [pagination, setPagination] = useState<PaginationState>({
    total: 0,
    totalPages: 0,
    pageSize: 20
  });

  useEffect(() => {
    fetchQuestions();
  }, [page, filters]);

  const fetchQuestions = async (): Promise<void> => {
    setLoading(true);

    // Build query parameters
    const params = new URLSearchParams({
      page: page.toString(),
      pageSize: pagination.pageSize.toString()
    });

    // Add filter parameters
    Object.keys(filters).forEach((key) => {
      const value = filters[key as keyof typeof filters];
      if (value !== undefined && value !== null && value.toString().trim() !== '') {
        // Map 'topic' to 'topicId' for API compatibility
        const apiKey = key === 'topic' ? 'topicId' : key;
        params.append(apiKey, value.toString());
      }
    });

    const response = await apiCallForSpaHelper({
      method: 'GET',
      url: `/api/workspaces/provider/${workspaceId}/questions?${params.toString()}`,
      params: {},
      body: {}
    });

    const result = response.data as ApiResponse<QuestionType.ListQuestionsResponse>;

    if (result && 'success' in result && result.success && result.data) {
      setQuestions(result.data.questions);
      setPagination({
        total: result.data.total,
        totalPages: result.data.totalPages,
        pageSize: result.data.pageSize
      });
    } else {
      const errorMessage = result && 'success' in result && !result.success && result.error ? result.error.message : 'Error fetching questions';
      ConsoleLogger.error('Error fetching questions:', errorMessage);
      toast.error('Error fetching questions');
    }
    setLoading(false);
  };

  const handleFiltersChange = (newFilters: QuestionType.QuestionFilters): void => {
    setFilters(newFilters);
    setPage(1); // Reset to first page when filters change
  };

  // Function to handle question updates from individual question items
  const handleQuestionUpdate = (updatedQuestion: QuestionType.PrivateAccess): void => {
    setQuestions(prevQuestions =>
      prevQuestions.map(q =>
        q.id === updatedQuestion.id ? updatedQuestion : q
      )
    );
  };

  // Function to handle question deletion
  const handleQuestionDelete = (deletedQuestionId: string): void => {
    setQuestions(prevQuestions =>
      prevQuestions.filter(q => q.id !== deletedQuestionId)
    );
    toast.success('Question deleted successfully');
  };

  return (
    <div className='w-full'>
      {/* Filters Section */}
      <ProviderQuestionsFiltersWidget
        onFiltersChange={handleFiltersChange}
        currentFilters={filters}
      />

      {/* Loading State */}
      {loading && (
        <div className='flex justify-center items-center py-12'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
          <span className='ml-3 text-gray-600'>Loading questions...</span>
        </div>
      )}

      {/* Questions List */}
      {!loading && (
        <div className='space-y-4 mt-6'>
          {questions.length === 0 ? (
            <div className='text-center py-12 bg-white rounded-lg border border-gray-200'>
              <p className='text-gray-500'>No questions found</p>
            </div>
          ) : (
            questions.map((question) => (
              <ProviderQuestionListItemWidget
                key={question.id}
                question={question}
                onUpdate={handleQuestionUpdate}
                onDelete={handleQuestionDelete}
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

