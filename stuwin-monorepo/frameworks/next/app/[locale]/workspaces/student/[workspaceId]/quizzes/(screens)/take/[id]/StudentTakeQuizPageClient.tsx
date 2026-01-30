"use client";

import {
  useState,
  useEffect
} from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { apiCallForSpaHelper } from '@/lib/helpers/apiCallForSpaHelper';
import { StudentPageTitleWidget } from '../../../../(widgets)/StudentPageTitleWidget';
import { StudentQuizQuestionWidget } from '../../../(widgets)/StudentQuizQuestionWidget';

import { ConsoleLogger } from '@/lib/app-infrastructure/loggers/ConsoleLogger';
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

    const response = await apiCallForSpaHelper({
      method: 'GET',
      url: `/api/workspaces/student/${workspaceId}/quizzes/${quizId}`,
    });

    if (response.status === 200) {
      const quizData = response.data.quiz;
      setQuiz(quizData);

      // Parse questions and prepare them for display
      const parsedQuestions = Array.isArray(quizData.questions)
        ? quizData.questions
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

      const response = await apiCallForSpaHelper({
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
    return (
      <div className='flex justify-center items-center py-12'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-brand'></div>
        <span className='ml-3 text-gray-600'>Loading quiz...</span>
      </div>
    );
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
          className='px-6 py-3 bg-gray-200 text-gray-800 font-semibold rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
        >
          ← Previous
        </button>

        <div className='flex gap-2'>
          {questions.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentQuestionIndex(index)}
              className={`w-8 h-8 rounded-full font-medium transition-colors ${index === currentQuestionIndex
                ? 'bg-brand text-white'
                : answers[questions[index]?.id]
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
            >
              {index + 1}
            </button>
          ))}
        </div>

        {currentQuestionIndex === questions.length - 1 ? (
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className='px-6 py-3 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
          >
            {submitting ? 'Submitting...' : 'Submit Quiz'}
          </button>
        ) : (
          <button
            onClick={handleNext}
            className='px-6 py-3 bg-brand text-white font-semibold rounded-md hover:bg-brand-dark transition-colors'
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


