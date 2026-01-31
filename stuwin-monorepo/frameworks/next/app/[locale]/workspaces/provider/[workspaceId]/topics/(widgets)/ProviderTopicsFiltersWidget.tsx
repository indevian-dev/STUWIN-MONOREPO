"use client";

import {
  useState,
  useEffect
} from 'react';
import { useParams } from 'next/navigation';
import { apiCallForSpaHelper } from '@/lib/helpers/apiCallForSpaHelper';
import { TopicFilters, Subject, ApiResponse } from '@/types';

interface ProviderTopicsFiltersState {
  topicId: string;
  topicName: string;
  subjectId: string;
  gradeLevel: string;
}

interface ProviderTopicsFiltersWidgetProps {
  onFiltersChange: (filters: TopicFilters) => void;
  currentFilters?: TopicFilters;
}

export function ProviderTopicsFiltersWidget({
  onFiltersChange,
  currentFilters = {}
}: ProviderTopicsFiltersWidgetProps) {
  const params = useParams();
  const workspaceId = params.workspaceId as string;
  const [subjects, setSubjects] = useState<Subject.PrivateAccess[]>([]);
  const [filters, setFilters] = useState<ProviderTopicsFiltersState>({
    topicId: '',
    topicName: (currentFilters.searchQuery) || '',
    subjectId: (currentFilters.subjectId?.toString()) || '',
    gradeLevel: (currentFilters.gradeLevel?.toString()) || ''
  });
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  useEffect(() => {
    // Fetch subjects for filter dropdown
    async function fetchSubjects(): Promise<void> {
      const response = await apiCallForSpaHelper({
        method: 'GET',
        url: `/api/workspaces/provider/${workspaceId}/subjects`,
        params: {}
      });

      const responseData = response.data as any;

      if (responseData && responseData.success && responseData.data) {
        setSubjects(responseData.data.subjects || []);
      }
    }
    fetchSubjects();
  }, []);

  const handleFilterChange = (key: keyof ProviderTopicsFiltersState, value: string): void => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleApplyFilters = (): void => {
    // Convert internal filter state to TopicFilters format
    const topicFilters: TopicFilters = {
      subjectId: filters.subjectId || undefined,
      gradeLevel: filters.gradeLevel ? parseInt(filters.gradeLevel) : undefined,
      searchQuery: filters.topicName || undefined,
    };
    onFiltersChange(topicFilters);
  };

  const handleResetFilters = (): void => {
    const emptyFilters: ProviderTopicsFiltersState = {
      topicId: '',
      topicName: '',
      subjectId: '',
      gradeLevel: ''
    };
    setFilters(emptyFilters);
    onFiltersChange({});
  };

  // Check if any filters are active
  const hasActiveFilters = filters.topicId || filters.topicName || filters.subjectId || filters.gradeLevel;

  return (
    <div className='bg-white rounded-lg border border-gray-200 mb-4 overflow-hidden'>
      {/* Filter Header - Always Visible */}
      <div className='p-4 bg-gray-50 border-b border-gray-200'>
        <div className='flex justify-between items-center'>
          <div className='flex items-center gap-3'>
            <h3 className='text-lg font-medium text-gray-900'>
              Filters
            </h3>
            {hasActiveFilters && (
              <span className='px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full font-medium'>
                Active
              </span>
            )}
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className='px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors'
          >
            {isExpanded ? '▲ Hide' : '▼ Show'} Filters
          </button>
        </div>
      </div>

      {/* Filter Content - Expandable */}
      {isExpanded && (
        <div className='p-4'>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
            {/* Topic ID */}
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Topic ID
              </label>
              <input
                type='text'
                value={filters.topicId}
                onChange={(e) => handleFilterChange('topicId', e.target.value)}
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                placeholder='Enter topic ID'
              />
            </div>

            {/* Topic Name Search */}
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Topic Name
              </label>
              <input
                type='text'
                value={filters.topicName}
                onChange={(e) => handleFilterChange('topicName', e.target.value)}
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                placeholder='Search by name'
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

            {/* Grade Level Filter */}
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Grade Level
              </label>
              <select
                value={filters.gradeLevel}
                onChange={(e) => handleFilterChange('gradeLevel', e.target.value)}
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
              >
                <option value=''>All Grades</option>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(grade => (
                  <option key={grade} value={grade}>
                    Grade {grade}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className='flex justify-end space-x-3 mt-4 pt-4 border-t border-gray-200'>
            <button
              onClick={handleResetFilters}
              className='px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors font-medium'
            >
              Reset Filters
            </button>
            <button
              onClick={handleApplyFilters}
              className='px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors font-medium'
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

