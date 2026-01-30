"use client";

import {
  useState
} from 'react';
import { Link } from '@/i18n/routing';
import { StudentLearningSessionModal } from '../../learning/(widgets)/StudentLearningSessionModal';

interface QuizResult {
  details?: any[];
  total_answered?: number;
  correct_answers: number;
  [key: string]: any;
}

interface Quiz {
  id: number;
  result: QuizResult | string;
  questions?: any[];
  [key: string]: any;
}

interface StudentQuizResultsWidgetProps {
  quiz: Quiz;
}

export function StudentQuizResultsWidget({ quiz }: StudentQuizResultsWidgetProps) {
  // ═══════════════════════════════════════════════════════════════
  // SECURITY NOTE: This component ONLY DISPLAYS pre-calculated results
  // All answer validation is done server-side in /api/workspaces/dashboard/quizzes/submit
  // The UI NEVER calculates if an answer is correct - it only shows the
  // is_correct flag that was already computed and stored by the API
  // ═══════════════════════════════════════════════════════════════

  const [analysisModal, setAnalysisModal] = useState<{
    isOpen: boolean;
    question: string;
    correctAnswer: string;
    userAnswer: string;
    subjectTitle?: string;
    complexity?: string;
  }>({
    isOpen: false,
    question: '',
    correctAnswer: '',
    userAnswer: '',
  });

  if (!quiz || !quiz.result) {
    return (
      <div className='text-center py-12'>
        <p className='text-gray-500'>No results available</p>
      </div>
    );
  }

  // Parse result if it's a JSON string
  const result = typeof quiz.result === 'string'
    ? JSON.parse(quiz.result)
    : quiz.result;

  // Get total questions from details array or quiz.questions
  const totalQuestions = result.details?.length
    || quiz.questions?.length
    || result.total_answered
    || 0;

  // Display score (calculated server-side)
  // Note: We recalculate percentage here only for display formatting
  // The actual correct_answers count was validated server-side
  const correctAnswers = result.correct_answers || 0;
  const scorePercentage = totalQuestions > 0
    ? Math.round((correctAnswers / totalQuestions) * 100)
    : 0;
  const isPassed = scorePercentage >= 70;

  // Calculate time statistics
  const totalTimeMinutes = Math.floor(result.total_time_spent / 60);
  const totalTimeSeconds = result.total_time_spent % 60;
  const avgTimePerQuestion = Math.round(result.average_time_per_question);

  const handleAnalyze = (detail: any) => {
    setAnalysisModal({
      isOpen: true,
      question: detail.question_body,
      correctAnswer: detail.correct_answer,
      userAnswer: detail.user_answer || 'Not answered',
      subjectTitle: detail.subject_title,
      complexity: detail.complexity,
    });
  };

  return (
    <div className='w-full max-w-5xl mx-auto space-y-6'>
      {/* Score Card */}
      <div className='bg-white rounded-lg shadow-md p-8 text-center'>
        <div className={`inline-flex items-center justify-center w-32 h-32 rounded-full mb-4 ${isPassed ? 'bg-green-100' : 'bg-red-100'
          }`}>
          <span className={`text-4xl font-bold ${isPassed ? 'text-green-600' : 'text-red-600'
            }`}>
            {scorePercentage.toFixed(0)}%
          </span>
        </div>

        <h2 className='text-3xl font-bold text-gray-800 mb-2'>
          {isPassed ? 'Congratulations! 🎉' : 'Keep Learning! 📚'}
        </h2>

        <p className='text-gray-600 mb-6'>
          {isPassed
            ? 'You passed the quiz!'
            : 'You can try again to improve your score.'}
        </p>

        {/* Stats Grid */}
        <div className='grid grid-cols-2 md:grid-cols-4 gap-4 mt-6'>
          <div className='bg-gray-50 rounded-lg p-4'>
            <p className='text-sm text-gray-600 mb-1'>Correct</p>
            <p className='text-2xl font-bold text-green-600'>
              {correctAnswers}/{totalQuestions}
            </p>
          </div>

          <div className='bg-gray-50 rounded-lg p-4'>
            <p className='text-sm text-gray-600 mb-1'>Incorrect</p>
            <p className='text-2xl font-bold text-red-600'>
              {totalQuestions - correctAnswers}
            </p>
          </div>

          <div className='bg-gray-50 rounded-lg p-4'>
            <p className='text-sm text-gray-600 mb-1'>Total Time</p>
            <p className='text-2xl font-bold text-blue-600'>
              {totalTimeMinutes}:{totalTimeSeconds.toString().padStart(2, '0')}
            </p>
          </div>

          <div className='bg-gray-50 rounded-lg p-4'>
            <p className='text-sm text-gray-600 mb-1'>Avg Time</p>
            <p className='text-2xl font-bold text-purple-600'>
              {avgTimePerQuestion}s
            </p>
          </div>
        </div>
      </div>

      {/* Detailed Results */}
      <div className='bg-white rounded-lg shadow-md p-6'>
        <h3 className='text-xl font-bold text-gray-800 mb-4'>
          Detailed Results
        </h3>

        <div className='space-y-4'>
          {result.details && result.details.map((detail: any, index: number) => {
            // Helper to safely render text content from potential objects
            const renderContent = (content: any) => {
              if (!content) return '';
              if (typeof content === 'string') return content;
              if (typeof content === 'object') {
                return content.text || content.body || JSON.stringify(content);
              }
              return String(content);
            };

            const questionBody = renderContent(detail.question_body);
            const userAnswer = renderContent(detail.user_answer);
            const correctAnswer = renderContent(detail.correct_answer);
            const explanation = renderContent(detail.explanation);

            return (
              <div
                key={index}
                className={`border-l-4 p-4 rounded-r-lg ${detail.is_correct
                  ? 'border-green-500 bg-green-50'
                  : 'border-red-500 bg-red-50'
                  }`}
              >
                {/* Question Number and Status */}
                <div className='flex items-start justify-between mb-2'>
                  <div className='flex items-center'>
                    <span className='font-semibold text-gray-700 mr-2'>
                      Q{index + 1}.
                    </span>
                    {detail.is_correct ? (
                      <span className='text-green-600 font-medium'>✓ Correct</span>
                    ) : (
                      <span className='text-red-600 font-medium'>✗ Incorrect</span>
                    )}
                  </div>
                  <span className='text-sm text-gray-500'>
                    {detail.time_spent}s
                  </span>
                </div>

                {/* Question Text */}
                <div className='text-gray-800 mb-3 font-medium'>
                  {questionBody}
                </div>

                {/* Answer Details */}
                <div className='space-y-2 text-sm'>
                  {userAnswer && (
                    <p className={`${detail.is_correct ? 'text-green-700' : 'text-red-700'
                      }`}>
                      Your answer: <strong>
                        {userAnswer}
                      </strong>
                    </p>
                  )}

                  {!detail.is_correct && userAnswer && (
                    <p className='text-green-700'>
                      Correct answer: <strong>{correctAnswer}</strong>
                    </p>
                  )}

                  {!userAnswer && (
                    <p className='text-gray-600 italic'>
                      Not answered — Correct: <strong>{correctAnswer}</strong>
                    </p>
                  )}
                </div>

                {/* Explanation */}
                {explanation && (
                  <div className='mt-3 pt-3 border-t border-gray-200'>
                    <p className='text-sm text-gray-700'>
                      <strong>Explanation:</strong> {explanation}
                    </p>
                  </div>
                )}

                {/* Meta Info */}
                <div className='flex gap-2 mt-3'>
                  {detail.subject_title && (
                    <span className='px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded'>
                      {detail.subject_title}
                    </span>
                  )}
                  {detail.complexity && (
                    <span className={`px-2 py-1 text-xs font-medium rounded ${detail.complexity === 'easy'
                      ? 'bg-green-100 text-green-800'
                      : detail.complexity === 'medium'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                      }`}>
                      {detail.complexity}
                    </span>
                  )}
                </div>

                {/* Analyze Button - Show for all questions */}
                <div className='mt-4 pt-3 border-t border-gray-200'>
                  <button
                    onClick={() => handleAnalyze(detail)}
                    className='flex items-center gap-2 px-4 py-2 bg-brand text-secondary text-sm font-medium rounded-md hover:from-purple-700 hover:to-indigo-700 transition-all shadow-sm hover:shadow-md'
                  >
                    <svg
                      className='w-4 h-4'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z'
                      />
                    </svg>
                    Analyze with AI
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Action Buttons */}
      <div className='flex gap-4 justify-center'>
        <Link
          href='/dashboard/quizzes'
          className='px-6 py-3 bg-gray-200 text-gray-800 font-semibold rounded-md hover:bg-gray-300 transition-colors'
        >
          View Quiz History
        </Link>

        <Link
          href='/dashboard/quizzes/start'
          className='px-6 py-3 bg-brand text-white font-semibold rounded-md hover:bg-brand-dark transition-colors'
        >
          Take Another Quiz
        </Link>
      </div>

      {/* Analysis Modal */}
      <StudentLearningSessionModal
        isOpen={analysisModal.isOpen}
        onClose={() => setAnalysisModal({ ...analysisModal, isOpen: false })}
        contextType="quiz"
        contextId={String(quiz.id)}
        initialQuestion={analysisModal.question}
        correctAnswer={analysisModal.correctAnswer}
        userAnswer={analysisModal.userAnswer}
        subjectTitle={analysisModal.subjectTitle}
        complexity={analysisModal.complexity}
      />
    </div>
  );
}

