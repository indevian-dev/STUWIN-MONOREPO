"use client";

import {
  useState,
  useEffect
} from 'react';
import { GlobalMathMarkdownTile } from '@/app/[locale]/(global)/(tiles)/GlobalMathMarkdown.tile';

interface StudentQuizQuestionWidgetProps {
  question: {
    id: string;
    body?: string;
    question?: string;
    questionText?: string;
    answers?: string[];
    correctAnswer?: string;
    complexity?: string;
    grade_level?: number;
    subject_title?: string;
  };
  questionNumber: number;
  totalQuestions: number;
  onAnswer: (questionId: string, answer: string, timeSpent: number) => void;
  selectedAnswer: string | null;
}

export function StudentQuizQuestionWidget({
  question,
  questionNumber,
  totalQuestions,
  onAnswer,
  selectedAnswer
}: StudentQuizQuestionWidgetProps) {
  const [timeSpent, setTimeSpent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeSpent(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleAnswerSelect = (answer: string) => {
    onAnswer(question.id, answer, timeSpent);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!question) {
    return null;
  }

  return (
    <div className='w-full max-w-4xl mx-auto'>
      {/* Progress Bar */}
      <div className='mb-6'>
        <div className='flex justify-between items-center mb-2'>
          <span className='text-sm font-medium text-gray-600'>
            Question {questionNumber} of {totalQuestions}
          </span>
          <span className='text-sm font-medium text-gray-600'>
            Time: {formatTime(timeSpent)}
          </span>
        </div>
        <div className='w-full bg-gray-200 rounded-app-full h-2'>
          <div
            className='bg-app-bright-green h-2 rounded-app-full transition-all duration-300'
            style={{ width: `${(questionNumber / totalQuestions) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Question Card */}
      <div className='bg-white rounded-app shadow-md p-6 md:p-8'>
        {/* Question Meta */}
        <div className='flex flex-wrap gap-2 mb-4'>
          {question.subject_title && (
            <span className='px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-app-full'>
              {question.subject_title}
            </span>
          )}
          {question.complexity && (
            <span className={`px-3 py-1 text-xs font-medium rounded-app-full ${question.complexity === 'easy'
              ? 'bg-green-100 text-green-800'
              : question.complexity === 'medium'
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-red-100 text-red-800'
              }`}>
              {question.complexity.charAt(0).toUpperCase() + question.complexity.slice(1)}
            </span>
          )}
          {question.grade_level && (
            <span className='px-3 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded-app-full'>
              Grade {question.grade_level}
            </span>
          )}
        </div>

        {/* Question Text */}
        <div className='mb-6'>
          <GlobalMathMarkdownTile
            content={question.body || question.question || question.questionText || 'Question text not available'}
            className="text-xl font-semibold text-gray-800 leading-relaxed"
          />
          {process.env.NODE_ENV === 'development' && !question.body && !question.question && (
            <div className='mt-2 text-xs text-red-500'>
              Debug: Question keys - {Object.keys(question).join(', ')}
            </div>
          )}
        </div>

        {/* Answer Options */}
        <div className='space-y-3'>
          {question.answers && Array.isArray(question.answers) && question.answers.map((answer: string, index: number) => {
            const answerKey = String.fromCharCode(65 + index); // A, B, C, D
            const isSelected = selectedAnswer === answerKey;

            return (
              <button
                key={index}
                onClick={() => handleAnswerSelect(answerKey)}
                className={`w-full text-left p-4 rounded-app border-2 transition-all duration-200 ${isSelected
                  ? 'border-app bg-app-bright-green/5'
                  : 'border-gray-200 hover:border-app/50 hover:bg-gray-50'
                  }`}
              >
                <div className='flex items-start'>
                  <span className={`flex-shrink-0 w-8 h-8 rounded-app-full flex items-center justify-center font-semibold ${isSelected
                    ? 'bg-app-bright-green text-white'
                    : 'bg-gray-200 text-gray-700'
                    }`}>
                    {answerKey}
                  </span>
                  <GlobalMathMarkdownTile content={answer} className="ml-3 text-gray-800 flex-1" />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

