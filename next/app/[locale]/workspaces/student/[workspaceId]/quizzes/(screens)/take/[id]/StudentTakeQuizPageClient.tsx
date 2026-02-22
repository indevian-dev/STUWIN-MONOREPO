"use client";

import {
  useState,
  useEffect
} from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { fetchApiUtil } from '@/lib/utils/Http.FetchApiSPA.util';
import { StudentPageTitleWidget } from '../../../../(widgets)/StudentPageTitle.widget';
import { StudentQuizQuestionWidget } from '../../../(widgets)/StudentQuizQuestion.widget';
import { GlobalLoaderTile } from '@/app/[locale]/(global)/(tiles)/GlobalLoader.tile';

import { ConsoleLogger } from '@/lib/logging/Console.logger';
interface Answer {
  questionId: string;
  selectedAnswer: string;
  timeSpent: number;
}

export default function StudentTakeQuizPageClient() {
  const params = useParams();
  const router = useRouter();
  const quizId = params.id as string;
  const workspaceId = params.workspaceId as string;

  const [loading, setLoading] = useState(true);
  const [quiz, setQuiz] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (quizId) {
      fetchQuiz();
    }
  }, [quizId]);

  const fetchQuiz = async () => {
    setLoading(true);

    const response = await fetchApiUtil<any>({
      method: 'GET',
      url: `/api/workspaces/student/${workspaceId}/quizzes/${quizId}`,
    });

    if (response.status === 200) {
      const quizData = response.data?.data?.quiz;
      setQuiz(quizData);

      // Use snapshotQuestions (actual question objects), not questions (just ID strings)
      const parsedQuestions = Array.isArray(quizData?.snapshotQuestions)
        ? quizData.snapshotQuestions
        : [];

      // Debug: Log the first question to see its structure
      if (parsedQuestions.length > 0) {
        ConsoleLogger.log('First question structure:', parsedQuestions[0]);
        ConsoleLogger.log('Question keys:', Object.keys(parsedQuestions[0]));
      }

      setQuestions(parsedQuestions);

      // If quiz is already completed, redirect to results
      if (quizData.status === 'completed') {
        toast.info('This quiz is already completed. Redirecting to results...');
        router.push(`/workspaces/student/${workspaceId}/quizzes/results/${quizId}`);
      }
    } else {
      toast.error('Failed to load quiz');
      router.push(`/workspaces/student/${workspaceId}/quizzes`);
    }

    setLoading(false);
  };

  const handleAnswer = (questionId: string, selectedAnswer: string, timeSpent: number) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: {
        questionId,
        selectedAnswer,
        timeSpent
      }
    }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    // Confirm submission
    const confirmed = window.confirm(
      `You have answered ${Object.keys(answers).length} out of ${questions.length} questions. Do you want to submit?`
    );

    if (!confirmed) return;

    setSubmitting(true);

    try {
      const answersArray = Object.values(answers);

      const response = await fetchApiUtil<any>({
        method: 'POST',
        url: `/api/workspaces/student/${workspaceId}/quizzes/submit`,
        body: {
          quizId: String(quizId),
          answers: answersArray
        }
      });

      if (response.status === 200) {
        toast.success('Quiz submitted successfully!');
        router.push(`/workspaces/student/${workspaceId}/quizzes/results/${quizId}`);
      } else {
        toast.error(response.data?.error || 'Failed to submit quiz');
      }
    } catch (error) {
      ConsoleLogger.error('Error submitting quiz:', error);
      toast.error('Failed to submit quiz');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <GlobalLoaderTile message="Loading quiz..." />;
  }

  if (!quiz || questions.length === 0) {
    return (
      <div className='text-center py-12'>
        <p className='text-gray-500'>Quiz not found or has no questions</p>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const currentAnswer = answers[currentQuestion?.id];

  return (
    <div className='space-y-6'>
      <StudentPageTitleWidget pageTitle='Take Quiz' />

      {/* Question Display */}
      <StudentQuizQuestionWidget
        question={currentQuestion}
        questionNumber={currentQuestionIndex + 1}
        totalQuestions={questions.length}
        onAnswer={handleAnswer}
        selectedAnswer={currentAnswer?.selectedAnswer}
      />

      {/* Navigation Buttons */}
      <div className='flex justify-between items-center max-w-4xl mx-auto'>
        <button
          onClick={handlePrevious}
          disabled={currentQuestionIndex === 0}
          className='px-6 py-3 bg-gray-200 text-gray-800 font-semibold rounded-app hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
        >
          ← Previous
        </button>

        <div className='flex gap-1 items-center overflow-hidden'>
          {(() => {
            const total = questions.length;
            const current = currentQuestionIndex;
            const pages: (number | 'ellipsis')[] = [];

            if (total <= 7) {
              // Show all pages if 7 or fewer
              for (let i = 0; i < total; i++) pages.push(i);
            } else {
              // Always show first page
              pages.push(0);

              if (current > 2) pages.push('ellipsis');

              // Pages around current
              const start = Math.max(1, current - 1);
              const end = Math.min(total - 2, current + 1);
              for (let i = start; i <= end; i++) pages.push(i);

              if (current < total - 3) pages.push('ellipsis');

              // Always show last page
              pages.push(total - 1);
            }

            return pages.map((page, i) =>
              page === 'ellipsis' ? (
                <span key={`e${i}`} className="px-1 text-gray-400 text-sm select-none">…</span>
              ) : (
                <button
                  key={page}
                  onClick={() => setCurrentQuestionIndex(page)}
                  className={`w-8 h-8 rounded-app-full font-medium text-sm transition-colors ${page === current
                    ? 'bg-app-bright-green text-white'
                    : answers[questions[page]?.id]
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                >
                  {page + 1}
                </button>
              )
            );
          })()}
        </div>

        {currentQuestionIndex === questions.length - 1 ? (
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className='px-6 py-3 bg-green-600 text-white font-semibold rounded-app hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
          >
            {submitting ? 'Submitting...' : 'Submit Quiz'}
          </button>
        ) : (
          <button
            onClick={handleNext}
            className='px-6 py-3 bg-app-bright-green text-white font-semibold rounded-app hover:bg-app-bright-green-dark transition-colors'
          >
            Next →
          </button>
        )}
      </div>

      {/* Answered Count */}
      <div className='text-center text-sm text-gray-600'>
        Answered: {Object.keys(answers).length} / {questions.length}
      </div>
    </div>
  );
}


