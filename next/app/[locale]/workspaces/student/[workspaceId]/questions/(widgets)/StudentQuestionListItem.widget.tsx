"use client";

import {
  useState
} from 'react';
import { FiEdit, FiEye, FiCheckCircle, FiClock } from 'react-icons/fi';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';

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

interface StudentQuestionListItemWidgetProps {
  question: Question;
  onUpdate: (question: Question) => void;
}

export function StudentQuestionListItemWidget({ question, onUpdate }: StudentQuestionListItemWidgetProps) {
  const t = useTranslations('Questions');

  // Parse answers if they're in JSON string format
  const answers = typeof question.answers === 'string'
    ? JSON.parse(question.answers)
    : question.answers;

  const isPublished = question.published_data?.is_active;

  return (
    <div className='bg-white rounded-app border border-gray-200 p-4 hover:shadow-md transition-shadow'>
      <div className='flex justify-between items-start mb-3'>
        <div className='flex-1'>
          <div className='flex items-start justify-between mb-2'>
            <p className='text-base font-medium text-gray-900 flex-1'>
              {question.body}
            </p>

            {/* Status Badge */}
            <span className={`ml-3 px-2 py-1 text-xs font-medium rounded-app-full ${isPublished
                ? 'bg-green-100 text-green-800'
                : 'bg-yellow-100 text-yellow-800'
              }`}>
              {isPublished ? (
                <span className='flex items-center gap-1'>
                  <FiCheckCircle size={12} /> Published
                </span>
              ) : (
                <span className='flex items-center gap-1'>
                  <FiClock size={12} /> Draft
                </span>
              )}
            </span>
          </div>

          {/* Metadata */}
          <div className='flex flex-wrap gap-2 text-xs mb-3'>
            {question.subject_title && (
              <span className='px-2 py-1 bg-blue-50 text-blue-700 rounded'>
                {question.subject_title}
              </span>
            )}
            {question.complexity && (
              <span className={`px-2 py-1 rounded ${question.complexity === 'easy' ? 'bg-green-50 text-green-700' :
                  question.complexity === 'medium' ? 'bg-yellow-50 text-yellow-700' :
                    'bg-red-50 text-red-700'
                }`}>
                {question.complexity}
              </span>
            )}
            {question.grade_level && (
              <span className='px-2 py-1 bg-gray-50 text-gray-700 rounded'>
                Grade {question.grade_level}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Answers Preview */}
      {answers && (
        <div className='mt-3 pl-4 border-l-2 border-gray-200'>
          <p className='text-xs font-medium text-gray-600 mb-2'>Answers:</p>
          <div className='space-y-1'>
            {Object.entries(answers).slice(0, 2).map(([key, value]: [string, any]) => (
              <p
                key={key}
                className={`text-sm ${key === question.correct_answer
                    ? 'text-green-700 font-medium'
                    : 'text-gray-600'
                  }`}
              >
                {key}. {String(value).substring(0, 50)}{String(value).length > 50 ? '...' : ''}
                {key === question.correct_answer && ' ✓'}
              </p>
            ))}
            {Object.keys(answers).length > 2 && (
              <p className='text-xs text-gray-400'>
                +{Object.keys(answers).length - 2} more answers
              </p>
            )}
          </div>
        </div>
      )}

      {/* Actions and Timestamp */}
      <div className='mt-3 flex justify-between items-center'>
        <span className='text-xs text-gray-500'>
          Created: {question.created_at ? new Date(question.created_at).toLocaleDateString() : 'N/A'}
        </span>

        <div className='flex items-center space-x-2'>
          <Link
            href={`/dashboard/questions/${question.id}`}
            className='px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded-app transition-colors flex items-center gap-1'
          >
            <FiEye size={14} /> View
          </Link>
          <Link
            href={`/dashboard/questions/${question.id}/edit`}
            className='px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded-app transition-colors flex items-center gap-1'
          >
            <FiEdit size={14} /> Edit
          </Link>
        </div>
      </div>
    </div>
  );
}

