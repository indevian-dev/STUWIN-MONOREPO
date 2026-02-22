'use client'

import {
    useState,
    memo
} from 'react';
import { useTranslations } from 'next-intl';
import { FiCheckCircle, FiXCircle } from 'react-icons/fi';

interface Question {
    id?: string;
    body: string;
    answers: Record<string, string> | string;
    correct_answer: string;
    explanation_guide?: string | { text?: string };
    subject_title?: string;
    complexity?: 'easy' | 'medium' | 'hard';
    grade_level?: number;
}

interface PublicQuestionsListWidgetProps {
    questions?: Question[];
    className?: string;
}

interface PublicQuestionItemWidgetProps {
    question: Question;
}

// Memoized QuestionsList component - only re-renders when questions prop changes
export function PublicQuestionsListWidget({ questions, className = '' }: PublicQuestionsListWidgetProps) {

    // Don't render anything if questions is null or empty
    if (!questions || questions.length === 0) {
        return null;
    }

    return (
        <div className={`w-full ${className} bg-white text-sm grid grid-cols-12 gap-4 `}>
            {questions.map((question, index) => (
                <PublicQuestionItemWidget
                    key={question.id || `question-${index}`}
                    question={question}
                />
            ))}
        </div>
    );
}


// Memoized QuestionItem component
export function PublicQuestionItemWidget({ question }: PublicQuestionItemWidgetProps) {
    const t = useTranslations('Global');
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
    const [showExplanation, setShowExplanation] = useState(false);

    // Parse answers from JSON if needed
    const answers: Record<string, string> = typeof question.answers === 'string'
        ? JSON.parse(question.answers)
        : question.answers;

    const handleAnswerSelect = (answerKey: string) => {
        setSelectedAnswer(answerKey);
        setShowExplanation(true);
    };

    const isCorrect = selectedAnswer === question.correct_answer;

    return (
        <div className='col-span-12 md:col-span-6 lg:col-span-4 bg-white border border-gray-200 rounded-app shadow-sm hover:shadow-md transition-shadow duration-200 p-4'>
            {/* Question Body */}
            <div className='mb-4'>
                <p className='text-base font-medium text-gray-900 mb-2'>
                    {question.body}
                </p>

                {/* Metadata */}
                <div className='flex flex-wrap gap-2 text-xs text-gray-500 mb-3'>
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

            {/* Answer Options */}
            <div className='space-y-2'>
                {answers && Object.entries(answers).map(([key, value]: [string, string]) => {
                    const isSelected = selectedAnswer === key;
                    const isCorrectAnswer = key === question.correct_answer;

                    return (
                        <button
                            key={key}
                            onClick={() => handleAnswerSelect(key)}
                            disabled={selectedAnswer !== null}
                            className={`w-full text-left p-3 rounded-app border-2 transition-all duration-200 ${!selectedAnswer
                                    ? 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                                    : isSelected
                                        ? isCorrect
                                            ? 'border-green-500 bg-green-50'
                                            : 'border-red-500 bg-red-50'
                                        : isCorrectAnswer
                                            ? 'border-green-500 bg-green-50'
                                            : 'border-gray-200 bg-gray-50'
                                } ${selectedAnswer !== null ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                        >
                            <div className='flex items-center justify-between'>
                                <span className='font-medium text-gray-700'>{key}.</span>
                                <span className='flex-1 ml-2 text-gray-900'>{value}</span>
                                {selectedAnswer !== null && isCorrectAnswer && (
                                    <FiCheckCircle className='text-green-600 ml-2' size={20} />
                                )}
                                {selectedAnswer === key && !isCorrect && (
                                    <FiXCircle className='text-red-600 ml-2' size={20} />
                                )}
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* Explanation */}
            {showExplanation && question.explanation_guide && (
                <div className={`mt-4 p-3 rounded-app ${isCorrect ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                    }`}>
                    <p className='text-sm font-medium mb-1'>
                        {isCorrect ? '✓ Correct!' : '✗ Incorrect'}
                    </p>
                    <p className='text-sm text-gray-700'>
                        {typeof question.explanation_guide === 'string'
                            ? question.explanation_guide
                            : question.explanation_guide.text || JSON.stringify(question.explanation_guide)}
                    </p>
                </div>
            )}
        </div>
    );
}

export default memo(PublicQuestionsListWidget);

