"use client";

import {
  useState,
  FormEvent
} from 'react';
import { ProviderSubjectSelectorWidget } from './ProviderSubjectSelectorWidget';
import { ProviderGradeLevelSelectorWidget } from './ProviderGradeLevelSelectorWidget';
import { ProviderComplexitySelectorWidget } from './ProviderComplexitySelectorWidget';
import { toast } from 'react-toastify';
import { apiCallForSpaHelper } from '@/lib/helpers/apiCallForSpaHelper';
import {
  Question,
  QuestionComplexity,
  QuestionLanguage,
  QuestionGeneratorFormData,
  QuestionGeneratorFormErrors,
  GenerateQuestionsResponse
} from '@/types/resources/questions';
import { ApiResponse } from '@/types';

import { ConsoleLogger } from '@/lib/app-infrastructure/loggers/ConsoleLogger';
// Component-specific prop types
interface ProviderAIQuestionGeneratorWidgetProps {
  onQuestionGenerated?: (questions: Question.PrivateAccess[]) => void;
  onCancel?: () => void;
}

export function ProviderAIQuestionGeneratorWidget({ 
  onQuestionGenerated, 
  onCancel 
}: ProviderAIQuestionGeneratorWidgetProps) {
  const [loading, setLoading] = useState<boolean>(false);
  const [formData, setFormData] = useState<QuestionGeneratorFormData>({
    subjectId: null,
    gradeLevel: null,
    complexity: null,
    topic: '',
    count: 1,
    language: 'azerbaijani'
  });
  const [errors, setErrors] = useState<QuestionGeneratorFormErrors>({});
  const [generatedQuestions, setGeneratedQuestions] = useState<Question.PrivateAccess[]>([]);

  const validateForm = (): boolean => {
    const newErrors: QuestionGeneratorFormErrors = {};

    if (!formData.subjectId) {
      newErrors.subjectId = 'Subject is required';
    }

    if (!formData.gradeLevel) {
      newErrors.gradeLevel = 'Grade level is required';
    }

    if (!formData.complexity) {
      newErrors.complexity = 'Complexity is required';
    }

    if (!formData.language) {
      newErrors.language = 'Language is required';
    }

    if (!formData.topic.trim()) {
      newErrors.topic = 'Topic is required';
    }

    if (formData.count < 1 || formData.count > 10) {
      newErrors.count = 'Count must be between 1 and 10';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleGenerate = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    setLoading(true);
    setGeneratedQuestions([]);

    try {
      const response = await apiCallForSpaHelper({
        method: 'POST',
        url: '/api/workspaces/provider/questions/generate',
        body: {
          subject_id: formData.subjectId,
          grade_level: formData.gradeLevel,
          complexity: formData.complexity,
          topic: formData.topic,
          count: formData.count,
          language: formData.language
        }
      }) as ApiResponse<GenerateQuestionsResponse>;

      if ('success' in response && response.success && 'data' in response) {
        const questions = response.data?.questions || [];
        setGeneratedQuestions(questions);
        toast.success(`Generated ${questions.length} question(s) successfully`);

        if (onQuestionGenerated && questions.length > 0) {
          onQuestionGenerated(questions);
        }
      } else {
        const errorMessage = 'error' in response
          ? response.error.message
          : 'Failed to generate questions';
        toast.error(errorMessage);
      }
    } catch (error) {
      ConsoleLogger.error('Error generating questions:', error);
      toast.error('An error occurred while generating questions');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleGenerate} className="bg-white p-6 rounded-lg border border-gray-200 space-y-6">
        <div className="border-b pb-4">
          <h3 className="text-lg font-semibold text-gray-900">AI Question Generator</h3>
          <p className="mt-1 text-sm text-gray-600">
            Generate questions automatically using AI based on subject, grade level, and topic
          </p>
        </div>

        {/* Subject, Grade Level, Complexity */}
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
            selectedComplexity={formData.complexity || ''}
            onComplexitySelect={(value) => setFormData({ ...formData, complexity: value as QuestionComplexity | null })}
            error={errors.complexity}
          />
        </div>

        {/* Language Selector */}
        <div>
          <label className='block text-sm font-medium text-gray-700 mb-1'>
            Generation Language <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.language}
            onChange={(e) => setFormData({ 
              ...formData, 
              language: e.target.value as QuestionLanguage 
            })}
            className={`w-full px-3 py-2 border ${errors.language ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
          >
            <option value="azerbaijani">Azerbaijani</option>
            <option value="russian">Russian</option>
            <option value="english">English</option>
          </select>
          {errors.language && (
            <p className="mt-1 text-sm text-red-600">{errors.language}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            Language in which questions and answers will be generated
          </p>
        </div>

        {/* Topic */}
        <div>
          <label className='block text-sm font-medium text-gray-700 mb-1'>
            Topic <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.topic}
            onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
            className={`w-full px-3 py-2 border ${errors.topic ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
            placeholder="e.g., Photosynthesis, Quadratic Equations, World War II"
          />
          {errors.topic && (
            <p className="mt-1 text-sm text-red-600">{errors.topic}</p>
          )}
        </div>

        {/* Number of Questions */}
        <div>
          <label className='block text-sm font-medium text-gray-700 mb-1'>
            Number of Questions <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            value={formData.count}
            onChange={(e) => setFormData({ ...formData, count: parseInt(e.target.value) || 1 })}
            min="1"
            max="10"
            className={`w-full px-3 py-2 border ${errors.count ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
          />
          {errors.count && (
            <p className="mt-1 text-sm text-red-600">{errors.count}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            Maximum 10 questions per generation
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
            className="px-6 py-2 text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {loading && (
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            {loading ? 'Generating...' : 'Generate Questions'}
          </button>
        </div>
      </form>

      {/* Generated Questions Display */}
      {generatedQuestions.length > 0 && (
        <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Generated Questions</h3>
          <div className="space-y-6">
            {generatedQuestions.map((q, index) => (
              <div key={q.id || index} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="mb-3">
                  <span className="text-sm font-medium text-gray-500">Question {index + 1}</span>
                  <p className="mt-1 text-gray-900">{q.question}</p>
                </div>
                <div className="mb-2">
                  <span className="text-sm font-medium text-gray-700">Answers:</span>
                  <ul className="mt-1 space-y-1">
                    {q.answers?.map((answer: string, ansIndex: number) => (
                      <li
                        key={ansIndex}
                        className={`text-sm ${answer === q.correctAnswer ? 'text-green-700 font-semibold' : 'text-gray-600'}`}
                      >
                        {answer === q.correctAnswer ? '✓ ' : '• '}{answer}
                      </li>
                    ))}
                  </ul>
                </div>
                {q.complexity && (
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Complexity:</span> {q.complexity}
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="pt-4 border-t text-sm text-gray-600">
            <p>✓ Questions have been saved to the database</p>
          </div>
        </div>
      )}
    </div>
  );
}

