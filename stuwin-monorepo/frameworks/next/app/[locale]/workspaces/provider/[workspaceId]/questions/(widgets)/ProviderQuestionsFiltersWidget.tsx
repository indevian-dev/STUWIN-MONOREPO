"use client";

import {
  useState,
  useEffect
} from 'react';
import { useParams } from 'next/navigation';
import { apiCallForSpaHelper } from '@/lib/helpers/apiCallForSpaHelper';
import { Question as QuestionType } from '@/types/resources/questions';
import { Subject } from '@/types/resources/subjects';
import type { Subject as SubjectType } from '@/types/resources/subjects';
import { ApiResponse } from '@/types';

interface ProviderQuestionsFiltersState {
  questionId: string;
  body: string;
  subjectId: string;
  topicId: string;
  complexity: string;
  gradeLevel: string;
  authorAccountId: string;
}

interface ProviderQuestionsFiltersWidgetProps {
  onFiltersChange: (filters: QuestionType.QuestionFilters) => void;
  currentFilters?: QuestionType.QuestionFilters;
}

export function ProviderQuestionsFiltersWidget({
  onFiltersChange,
  currentFilters = {}
}: ProviderQuestionsFiltersWidgetProps) {
  const params = useParams();
  const workspaceId = params.workspaceId as string;
  const [subjects, setSubjects] = useState<SubjectType.PrivateAccess[]>([]);
  const [topics, setTopics] = useState<SubjectType.PrivateAccess[]>([]);
  const [filters, setFilters] = useState<ProviderQuestionsFiltersState>({
    questionId: (currentFilters.subjectId?.toString()) || '',
    body: (currentFilters.searchQuery) || '',
    subjectId: (currentFilters.subjectId?.toString()) || '',
    topicId: (currentFilters.topic?.toString()) || '',
    complexity: (currentFilters.complexity) || '',
    gradeLevel: (currentFilters.gradeLevel?.toString()) || '',
    authorAccountId: (currentFilters.createdBy?.toString()) || ''
  });

  useEffect(() => {
    // Fetch subjects for filter dropdown
    async function fetchSubjects(): Promise<void> {
      const response = await apiCallForSpaHelper({
        method: 'GET',
        url: `/api/workspaces/provider/${workspaceId}/subjects`
      });

      if (response.status === 200 && response.data?.subjects) {
        setSubjects(response.data.subjects || []);
      }
    }
    fetchSubjects();
  }, []);

  useEffect(() => {
    // Fetch topics when subject changes
    if (filters.subjectId) {
      async function fetchTopics(): Promise<void> {
        const response = await apiCallForSpaHelper({
          method: 'GET',
          url: `/api/workspaces/provider/${workspaceId}/topics?subjectId=${filters.subjectId}`
        });

        if (response.status === 200 && response.data?.topics) {
          setTopics(response.data.topics || []);
        }
      }
      fetchTopics();
    } else {
      setTopics([]);
      setFilters(prev => ({ ...prev, topicId: '' }));
    }
  }, [filters.subjectId]);

  const handleFilterChange = (key: keyof ProviderQuestionsFiltersState, value: string): void => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleApplyFilters = (): void => {
    // Convert internal filter state to QuestionFilters format
    // Note: topicId is actually the topic name (text field)
    const questionFilters: QuestionType.QuestionFilters = {
      subjectId: filters.subjectId || undefined,
      topic: filters.topicId || undefined,
      gradeLevel: filters.gradeLevel ? parseInt(filters.gradeLevel) : undefined,
      complexity: filters.complexity as 'easy' | 'medium' | 'hard' || undefined,
      searchQuery: filters.body || undefined,
      createdBy: filters.authorAccountId || undefined,
    };
    onFiltersChange(questionFilters);
  };

  const handleResetFilters = (): void => {
    const emptyFilters: ProviderQuestionsFiltersState = {
      questionId: '',
      body: '',
      subjectId: '',
      topicId: '',
      complexity: '',
      gradeLevel: '',
      authorAccountId: ''
    };
    setFilters(emptyFilters);
    setTopics([]);
    onFiltersChange({});
  };

  return (
    <div className='bg-white rounded-lg border border-gray-200 p-4'>
      <h3 className='text-lg font-medium text-gray-900 mb-4'>Filters</h3>

      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
        {/* Question ID */}
        <div>
          <label className='block text-sm font-medium text-gray-700 mb-1'>
            Question ID
          </label>
          <input
            type='text'
            value={filters.questionId}
            onChange={(e) => handleFilterChange('questionId', e.target.value)}
            className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
            placeholder='Enter question ID'
          />
        </div>

        {/* Body Search */}
        <div>
          <label className='block text-sm font-medium text-gray-700 mb-1'>
            Search Question
          </label>
          <input
            type='text'
            value={filters.body}
            onChange={(e) => handleFilterChange('body', e.target.value)}
            className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
            placeholder='Search question text'
          />
        </div>

        {/* Subject Filter */}
        <div>
          <label className='block text-sm font-medium text-gray-700 mb-1'>
            Subject
          </label>
          <select
            value={filters.subjectId}
            onChange={(e) => handleFilterChange('subjectId', e.target.value)}
            className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
          >
            <option value=''>All Subjects</option>
            {subjects.map(subject => (
              <option key={subject.id} value={subject.id}>
                {subject.title}
              </option>
            ))}
          </select>
        </div>

        {/* Topic Filter */}
        <div>
          <label className='block text-sm font-medium text-gray-700 mb-1'>
            Topic
          </label>
          <select
            value={filters.topicId}
            onChange={(e) => handleFilterChange('topicId', e.target.value)}
            className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed'
            disabled={!filters.subjectId}
          >
            <option value=''>
              {!filters.subjectId ? 'Select subject first' : 'All Topics'}
            </option>
            {topics.map(topic => (
              <option key={topic.id} value={topic.title}>
                {topic.title}
              </option>
            ))}
          </select>
        </div>

        {/* Complexity Filter */}
        <div>
          <label className='block text-sm font-medium text-gray-700 mb-1'>
            Complexity
          </label>
          <select
            value={filters.complexity}
            onChange={(e) => handleFilterChange('complexity', e.target.value)}
            className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
          >
            <option value=''>All Levels</option>
            <option value='easy'>Easy</option>
            <option value='medium'>Medium</option>
            <option value='hard'>Hard</option>
          </select>
        </div>

        {/* Grade Level Filter */}
        <div>
          <label className='block text-sm font-medium text-gray-700 mb-1'>
            Grade Level
          </label>
          <input
            type='number'
            value={filters.gradeLevel}
            onChange={(e) => handleFilterChange('gradeLevel', e.target.value)}
            className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
            placeholder='Enter grade level'
            min='1'
            max='12'
          />
        </div>

        {/* Author Account ID */}
        <div>
          <label className='block text-sm font-medium text-gray-700 mb-1'>
            Author ID
          </label>
          <input
            type='text'
            value={filters.authorAccountId}
            onChange={(e) => handleFilterChange('authorAccountId', e.target.value)}
            className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
            placeholder='Enter author ID'
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className='flex justify-end space-x-3 mt-4'>
        <button
          onClick={handleResetFilters}
          className='px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors'
        >
          Reset
        </button>
        <button
          onClick={handleApplyFilters}
          className='px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors'
        >
          Apply Filters
        </button>
      </div>
    </div>
  );
}

