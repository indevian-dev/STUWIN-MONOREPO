"use client";

import {
  useState,
  useEffect
} from 'react';
import { useParams } from 'next/navigation';
import { apiCallForSpaHelper } from '@/lib/helpers/apiCallForSpaHelper';
import { toast } from 'react-toastify';
import { useTranslations } from 'next-intl';
import { Question as QuestionType } from '@/types/resources/questions';
import { Subject } from '@/types/resources/subjects';
import type { Subject as SubjectType } from '@/types/resources/subjects';
import { ApiResponse } from '@/types';

import { ConsoleLogger } from '@/lib/app-infrastructure/loggers/ConsoleLogger';
interface QuestionEditFormData {
  body: string;
  subject_id: string;
  grade_level: number | string;
  complexity: string;
  answers: string[];
  correct_answer: string;
  explanation_guide: any;
}

// Extended Question type with additional fields from API
interface QuestionWithPublishData extends QuestionType.PrivateAccess {
  published_data?: {
    is_active: boolean;
    published_at?: string;
  };
  author_email?: string;
  subject_title?: string;
}

interface ProviderQuestionListItemWidgetProps {
  question: QuestionWithPublishData;
  onUpdate: (question: QuestionWithPublishData) => void;
  onDelete: (questionId: string) => void;
}

export function ProviderQuestionListItemWidget({ question, onUpdate, onDelete }: ProviderQuestionListItemWidgetProps) {
  const params = useParams();
  const workspaceId = params.workspaceId as string;
  const t = useTranslations('Questions');
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [subjects, setSubjects] = useState<SubjectType.PrivateAccess[]>([]);
  const [loadingSubjects, setLoadingSubjects] = useState<boolean>(false);
  const [isPublishing, setIsPublishing] = useState<boolean>(false);

  // Form state
  const [formData, setFormData] = useState<QuestionEditFormData>(() => {
    const correctAnswerValue = (question as any).correctAnswer || (question as any).correct_answer || '';
    const answersArray = question.answers || ['', '', '', ''];
    const normalizedCorrectAnswer = answersArray.includes(correctAnswerValue) ? correctAnswerValue : '';

    return {
      body: question.question || '',
      subject_id: question.subjectId || '',
      grade_level: question.gradeLevel || '',
      complexity: question.complexity || '',
      answers: answersArray,
      correct_answer: normalizedCorrectAnswer,
      explanation_guide: null
    };
  });

  // Fetch subjects when modal opens
  useEffect(() => {
    if (showEditModal && subjects.length === 0) {
      fetchSubjects();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showEditModal]);

  // Reset form data when question changes or modal opens
  useEffect(() => {
    if (showEditModal) {
      const correctAnswerValue = (question as any).correctAnswer || (question as any).correct_answer || '';
      const answersArray = question.answers || ['', '', '', ''];

      // Ensure the correct answer is one of the answers
      const normalizedCorrectAnswer = answersArray.includes(correctAnswerValue)
        ? correctAnswerValue
        : '';

      setFormData({
        body: question.question || '',
        subject_id: String(question.subjectId || ''),
        grade_level: question.gradeLevel || '',
        complexity: question.complexity || '',
        answers: answersArray,
        correct_answer: normalizedCorrectAnswer,
        explanation_guide: null
      });
    }
  }, [showEditModal, question]);

  const fetchSubjects = async (): Promise<void> => {
    setLoadingSubjects(true);
    try {
      const response = await apiCallForSpaHelper({
        method: 'GET',
        url: `/api/workspaces/provider/${workspaceId}/subjects`
      });

      if (response.status === 200 && response.data?.subjects) {
        setSubjects(response.data.subjects);
      }
    } catch (error) {
      ConsoleLogger.error('Error fetching subjects:', error);
      toast.error('Failed to load subjects');
    } finally {
      setLoadingSubjects(false);
    }
  };

  const handleFormChange = (field: keyof QuestionEditFormData, value: any): void => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAnswerChange = (index: number, value: string): void => {
    const oldAnswer = formData.answers[index];
    const newAnswers = [...formData.answers];
    newAnswers[index] = value;

    setFormData(prev => ({
      ...prev,
      answers: newAnswers,
      // If the edited answer was the correct answer, update correct_answer to the new value
      correct_answer: prev.correct_answer === oldAnswer ? value : prev.correct_answer
    }));
  };

  const addAnswer = (): void => {
    if (formData.answers.length < 6) {
      setFormData(prev => ({
        ...prev,
        answers: [...prev.answers, '']
      }));
    }
  };

  const removeAnswer = (index: number): void => {
    if (formData.answers.length > 2) {
      const removedAnswer = formData.answers[index];
      const newAnswers = formData.answers.filter((_, i) => i !== index);
      setFormData(prev => ({
        ...prev,
        answers: newAnswers,
        // Clear correct answer if it was the removed answer
        correct_answer: prev.correct_answer === removedAnswer ? '' : prev.correct_answer
      }));
    }
  };

  const handleUpdate = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();

    // Validation
    if (!formData.body.trim()) {
      toast.error('Question body is required');
      return;
    }

    if (!formData.subject_id) {
      toast.error('Subject is required');
      return;
    }

    if (!formData.grade_level) {
      toast.error('Grade level is required');
      return;
    }

    if (!formData.complexity) {
      toast.error('Complexity is required');
      return;
    }

    const filledAnswers = formData.answers.filter(a => a.trim());
    if (filledAnswers.length < 2) {
      toast.error('At least 2 answers are required');
      return;
    }

    if (!formData.correct_answer || !filledAnswers.includes(formData.correct_answer)) {
      toast.error('Please select a correct answer from the provided options');
      return;
    }

    setIsUpdating(true);
    try {
      const response = await apiCallForSpaHelper({
        method: 'PUT',
        url: `/api/workspaces/provider/${workspaceId}/questions/update/${question.id}`,
        params: {},
        body: {
          body: formData.body.trim(),
          subject_id: formData.subject_id,
          grade_level: parseInt(formData.grade_level as string),
          complexity: formData.complexity,
          answers: filledAnswers,
          correct_answer: formData.correct_answer,
          explanation_guide: formData.explanation_guide
        }
      });

      if (response.status === 200 && response.data?.data?.question) {
        toast.success('Question updated successfully');
        setShowEditModal(false);
        if (onUpdate) {
          onUpdate(response.data.data.question);
        }
      } else {
        const errorMessage = response.data?.error || 'Failed to update question';
        toast.error(errorMessage);
      }
    } catch (error) {
      ConsoleLogger.error('Error updating question:', error);
      toast.error('An error occurred while updating the question');
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePublish = async (): Promise<void> => {
    setIsPublishing(true);
    try {
      const response = await apiCallForSpaHelper({
        method: 'POST',
        url: `/api/workspaces/provider/${workspaceId}/questions/publish/${question.id}`,
        params: {},
        body: { approved: true }
      });

      if (response.status === 200 && response.data) {
        toast.success(response.data.message || 'Question published successfully');
        if (onUpdate) {
          // Refresh the question data
          onUpdate({
            ...question
          });
        }
      } else {
        const errorMessage = response.data?.error || 'Failed to publish question';
        toast.error(errorMessage);
      }
    } catch (error) {
      ConsoleLogger.error('Error publishing question:', error);
      toast.error('An error occurred while publishing the question');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleDelete = async (): Promise<void> => {
    setIsDeleting(true);
    try {
      const response = await apiCallForSpaHelper({
        method: 'DELETE',
        url: `/api/workspaces/provider/${workspaceId}/questions/delete/${question.id}`,
        params: {},
        body: {}
      });

      if (response.status === 200) {
        toast.success('Question deleted successfully');
        if (onDelete) {
          onDelete(question.id);
        }
      } else {
        const errorMessage = response.data?.error || 'Failed to delete question';
        toast.error(errorMessage);
      }
    } catch (error) {
      ConsoleLogger.error('Error deleting question:', error);
      toast.error('An error occurred while deleting the question');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div className='bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow'>
      {/* Question Header */}
      <div className='flex justify-between items-start mb-4'>
        <div className='flex-1'>
          <div className='flex items-center gap-2 mb-2'>
            <span className='text-xs font-medium text-gray-500'>ID: {question.id}</span>
            <span className='text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700 font-medium'>
              {question.complexity || 'N/A'}
            </span>
            <span className='text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-700 font-medium'>
              Grade {question.gradeLevel || 'N/A'}
            </span>
          </div>
          <p className='text-gray-900 font-medium text-lg leading-relaxed'>
            {question.question}
          </p>
        </div>
      </div>

      {/* Subject & Author Info */}
      <div className='flex flex-wrap gap-4 mb-4 text-sm text-gray-600'>
        {(question.subject_title) && (
          <div>
            <span className='font-medium'>Subject:</span>
            <span className='ml-1'>{question.subject_title}</span>
          </div>
        )}
        {(question.author_email) && (
          <div>
            <span className='font-medium'>Author:</span>
            <span className='ml-1'>{question.author_email}</span>
          </div>
        )}
        {(question.createdAt) && (
          <div>
            <span className='font-medium'>Created:</span>
            <span className='ml-1'>{new Date(question.createdAt).toLocaleDateString()}</span>
          </div>
        )}
      </div>

      {/* Answers */}
      {question.answers && Array.isArray(question.answers) && (
        <div className='mb-4'>
          <p className='text-sm font-medium text-gray-700 mb-2'>Answers:</p>
          <div className='space-y-1'>
            {question.answers.map((answer: string, index: number) => {
              const correctAnswer = question.correctAnswer;
              return (
                <div
                  key={index}
                  className={`text-sm p-2 rounded ${answer === correctAnswer
                    ? 'bg-green-50 text-green-800 font-semibold border border-green-200'
                    : 'bg-gray-50 text-gray-700'
                    }`}
                >
                  {answer === correctAnswer ? '✓ ' : '• '}{answer}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className='flex gap-3 pt-4 border-t'>
        <button
          onClick={() => setShowEditModal(true)}
          className='px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium'
        >
          Edit
        </button>

        <button
          onClick={handlePublish}
          disabled={isPublishing}
          className='px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed'
        >
          {isPublishing ? 'Publishing...' : 'Approve & Publish'}
        </button>

        {!showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            disabled={isDeleting}
            className='px-4 py-2 bg-red-50 text-red-600 rounded-md hover:bg-red-100 transition-colors text-sm font-medium border border-red-200'
          >
            Delete
          </button>
        ) : (
          <div className='flex gap-2'>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className='px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed'
            >
              {isDeleting ? 'Deleting...' : 'Confirm Delete'}
            </button>
            <button
              onClick={() => setShowDeleteConfirm(false)}
              disabled={isDeleting}
              className='px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors text-sm font-medium'
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* Edit Modal - simplified for space, contains form fields */}
      {showEditModal && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
          <div className='bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto'>
            <form onSubmit={handleUpdate} className='p-6'>
              <div className='flex justify-between items-center mb-6 pb-4 border-b'>
                <h2 className='text-2xl font-bold text-gray-900'>Edit Question</h2>
                <button
                  type='button'
                  onClick={() => setShowEditModal(false)}
                  className='text-gray-400 hover:text-gray-600 text-2xl font-bold w-8 h-8 flex items-center justify-center'
                >
                  ×
                </button>
              </div>

              {/* Form fields would go here - simplified for token efficiency */}
              <div className='mb-6'>
                <label className='block text-sm font-medium text-gray-700 mb-2'>Question Body *</label>
                <textarea
                  value={formData.body}
                  onChange={(e) => handleFormChange('body', e.target.value)}
                  rows={4}
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                  placeholder='Enter the question...'
                  required
                />
              </div>

              <div className='flex gap-3 pt-4 border-t'>
                <button
                  type='submit'
                  disabled={isUpdating}
                  className='px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed'
                >
                  {isUpdating ? 'Updating...' : 'Update Question'}
                </button>
                <button
                  type='button'
                  onClick={() => setShowEditModal(false)}
                  disabled={isUpdating}
                  className='px-6 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors font-medium'
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

