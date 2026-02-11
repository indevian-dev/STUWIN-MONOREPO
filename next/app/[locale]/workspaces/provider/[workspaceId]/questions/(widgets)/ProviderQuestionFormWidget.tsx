"use client";

import {
  useState,
  useEffect,
  FormEvent
} from 'react';
import { useParams } from 'next/navigation';
import { ProviderSubjectSelectorWidget } from './ProviderSubjectSelectorWidget';
import { ProviderGradeLevelSelectorWidget } from './ProviderGradeLevelSelectorWidget';
import { ProviderComplexitySelectorWidget } from './ProviderComplexitySelectorWidget';
import { ProviderAnswersEditorWidget } from './ProviderAnswersEditorWidget';
import { toast } from 'react-toastify';
import { apiCallForSpaHelper } from '@/lib/utils/http/SpaApiClient';
import { GlobalLoaderTile } from '@/app/[locale]/(global)/(tiles)/GlobalLoaderTile';
import { BaseFormProps, FormMode } from '@/types';
import { Question as QuestionType, QuestionComplexity, ExplanationGuide } from '@/types/domain/question';
import { ApiResponse } from '@/types';

import { ConsoleLogger } from '@/lib/logging/ConsoleLogger';
// Component-specific form state
interface ProviderQuestionFormData {
  body: string;
  subjectId: string | null;
  gradeLevel: number | null;
  complexity: string | null;
  answers: string[];
  correctAnswer: string;
  explanationGuide: string;
  aiAssistantCrib: string;
}

interface ProviderQuestionFormErrors {
  body?: string;
  subjectId?: string;
  gradeLevel?: string;
  complexity?: string;
  answers?: string;
  correctAnswer?: string;
  explanationGuide?: string;
}


interface QuestionData {
  id?: string;
  body: string;
  subject_id: string | null;
  grade_level: number | null;
  complexity: QuestionComplexity | null;
  answers: string[];
  correct_answer: string;
  explanation_guide?: ExplanationGuide;
  aiAssistantCrib?: string;
}

interface ProviderQuestionFormWidgetProps {
  initialData?: QuestionData | null;
  onSuccess: (data: QuestionType.PrivateAccess) => void;
  onCancel?: () => void;
  mode?: FormMode;
}

export function ProviderQuestionFormWidget({
  initialData = null,
  onSuccess,
  onCancel,
  mode = 'create'
}: ProviderQuestionFormWidgetProps) {
  const params = useParams();
  const workspaceId = params.workspaceId as string;
  const [loading, setLoading] = useState<boolean>(false);
  const [formData, setFormData] = useState<ProviderQuestionFormData>({
    body: '',
    subjectId: null,
    gradeLevel: null,
    complexity: null,
    answers: ['', '', '', ''],
    correctAnswer: '',
    explanationGuide: '',
    aiAssistantCrib: ''
  });
  const [errors, setErrors] = useState<ProviderQuestionFormErrors>({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        body: initialData.body || '',
        subjectId: initialData.subject_id || null,
        gradeLevel: initialData.grade_level || null,
        complexity: initialData.complexity || '',
        answers: initialData.answers || ['', '', '', ''],
        correctAnswer: initialData.correct_answer || '',
        explanationGuide: initialData.explanation_guide ? JSON.stringify(initialData.explanation_guide) : '',
        aiAssistantCrib: initialData.aiAssistantCrib || ''
      });
    }
  }, [initialData]);

  const validateForm = (): boolean => {
    const newErrors: ProviderQuestionFormErrors = {};

    if (!formData.body.trim()) {
      newErrors.body = 'Question body is required';
    }

    if (!formData.subjectId) {
      newErrors.subjectId = 'Subject is required';
    }

    if (!formData.gradeLevel) {
      newErrors.gradeLevel = 'Grade level is required';
    }

    if (!formData.complexity) {
      newErrors.complexity = 'Complexity is required';
    }

    const validAnswers = formData.answers.filter(a => a.trim() !== '');
    if (validAnswers.length < 2) {
      newErrors.answers = 'At least 2 answers are required';
    }

    if (!formData.correctAnswer || formData.correctAnswer.trim() === '') {
      newErrors.correctAnswer = 'Please select the correct answer';
    }

    if (formData.correctAnswer && !formData.answers.includes(formData.correctAnswer)) {
      newErrors.correctAnswer = 'Correct answer must be one of the answer options';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    setLoading(true);

    try {
      let explanationGuideJson = null;
      if (formData.explanationGuide.trim()) {
        try {
          explanationGuideJson = JSON.parse(formData.explanationGuide);
        } catch (parseError) {
          toast.error('Explanation guide must be valid JSON');
          setLoading(false);
          return;
        }
      }

      const payload: QuestionType.CreateInput | QuestionType.UpdateInput = {
        question: formData.body,
        answers: formData.answers.filter(a => a.trim() !== ''),
        correctAnswer: formData.correctAnswer,
        complexity: formData.complexity as 'easy' | 'medium' | 'hard',
        subjectId: formData.subjectId!,
        gradeLevel: formData.gradeLevel!,
        topic: '',
        language: 'azerbaijani',
        explanationGuide: {
          correct: '',
          incorrect: '',
          hints: []
        },
        aiAssistantCrib: formData.aiAssistantCrib || undefined
      };

      const response = await apiCallForSpaHelper({
        method: mode === 'edit' ? 'PATCH' : 'POST',
        url: mode === 'edit'
          ? `/api/workspaces/provider/${workspaceId}/questions/${initialData?.id}`
          : `/api/workspaces/provider/${workspaceId}/questions`,
        body: payload
      });

      const result = response.data as ApiResponse<{ question: QuestionType.PrivateAccess }>;

      if (result && 'success' in result && result.success && result.data) {
        // Validation passed
        toast.success(mode === 'edit' ? 'Question updated successfully' : 'Question created successfully');
        if (onSuccess) {
          onSuccess(result.data.question);
        }
      } else {
        const errorMessage = result && 'success' in result && !result.success && result.error ? result.error.message : 'Failed to save question';
        toast.error(errorMessage);
      }
    } catch (error) {
      ConsoleLogger.error('Error saving question:', error);
      toast.error('An error occurred while saving the question');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {loading && <GlobalLoaderTile fullPage={true} message="Saving Question..." />}
      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg border border-gray-200">
        {/* Question Body */}
        <div>
          <label className='block text-sm font-medium text-gray-700 mb-1'>
            Question <span className="text-red-500">*</span>
          </label>
          <textarea
            value={formData.body}
            onChange={(e) => setFormData({ ...formData, body: e.target.value })}
            rows={4}
            className={`w-full px-3 py-2 border ${errors.body ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
            placeholder="Enter the question text"
          />
          {errors.body && (
            <p className="mt-1 text-sm text-red-600">{errors.body}</p>
          )}
        </div>

        {/* Subject, Grade Level, Complexity in a grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <ProviderSubjectSelectorWidget
            selectedSubjectId={formData.subjectId}
            onSubjectSelect={(value) => setFormData({ ...formData, subjectId: value })}
            error={errors.subjectId}
          />

          <ProviderGradeLevelSelectorWidget
            selectedGradeLevel={formData.gradeLevel}
            onGradeLevelSelect={(value) => setFormData({ ...formData, gradeLevel: value })}
            error={errors.gradeLevel}
          />

          <ProviderComplexitySelectorWidget
            selectedComplexity={formData.complexity}
            onComplexitySelect={(value) => setFormData({ ...formData, complexity: value })}
            error={errors.complexity}
          />
        </div>

        {/* Answers Editor */}
        <ProviderAnswersEditorWidget
          answers={formData.answers}
          correctAnswer={formData.correctAnswer}
          onAnswersChange={(answers) => setFormData({ ...formData, answers })}
          onCorrectAnswerChange={(answer) => setFormData({ ...formData, correctAnswer: answer })}
          errors={errors}
        />

        {/* Explanation Guide (optional) */}
        <div>
          <label className='block text-sm font-medium text-gray-700 mb-1'>
            Explanation Guide (JSON format, optional)
          </label>
          <textarea
            value={formData.explanationGuide}
            onChange={(e) => setFormData({ ...formData, explanationGuide: e.target.value })}
            rows={3}
            className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm'
            placeholder='{"hint": "Explanation text", "resources": ["link1", "link2"]}'
          />
          <p className="mt-1 text-xs text-gray-500">
            Enter a JSON object with explanation details (optional)
          </p>
        </div>

        {/* AI Assistant Crib */}
        <div>
          <label className='block text-sm font-medium text-gray-700 mb-1'>
            AI Assistant Crib (Context for AI Tutor)
          </label>
          <textarea
            value={formData.aiAssistantCrib}
            onChange={(e) => setFormData({ ...formData, aiAssistantCrib: e.target.value })}
            rows={3}
            className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm'
            placeholder="Special instructions or hints for the AI when helping students with this question"
          />
          <p className="mt-1 text-xs text-gray-500">
            This content will be passed to the AI Tutor to provide specific context or hints.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-4 border-t">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="px-6 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {loading ? 'Saving...' : (mode === 'edit' ? 'Update Question' : 'Create Question')}
          </button>
        </div>
      </form>
    </>
  );
}
