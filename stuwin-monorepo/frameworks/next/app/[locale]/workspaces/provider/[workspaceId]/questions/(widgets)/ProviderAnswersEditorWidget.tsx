"use client";

import {
  useState,
  useEffect
} from 'react';

interface ProviderAnswersEditorWidgetProps {
  answers: string[];
  correctAnswer: string;
  onAnswersChange: (answers: string[]) => void;
  onCorrectAnswerChange: (answer: string) => void;
  errors?: {
    answers?: string;
    correctAnswer?: string;
  };
}

export function ProviderAnswersEditorWidget({ answers, correctAnswer, onAnswersChange, onCorrectAnswerChange, errors }: ProviderAnswersEditorWidgetProps) {
  const [answersList, setAnswersList] = useState<string[]>(
    answers && answers.length > 0 ? answers : ['', '', '', '']
  );

  useEffect(() => {
    if (answers && answers.length > 0) {
      setAnswersList(answers);
    }
  }, [answers]);

  const handleAnswerChange = (index: number, value: string) => {
    const newAnswers = [...answersList];
    newAnswers[index] = value;
    setAnswersList(newAnswers);
    onAnswersChange(newAnswers);
  };

  const handleAddAnswer = () => {
    const newAnswers = [...answersList, ''];
    setAnswersList(newAnswers);
    onAnswersChange(newAnswers);
  };

  const handleRemoveAnswer = (index: number) => {
    if (answersList.length <= 2) {
      return; // Minimum 2 answers required
    }
    const newAnswers = answersList.filter((_, i) => i !== index);
    setAnswersList(newAnswers);
    onAnswersChange(newAnswers);
    
    // If the correct answer was removed, reset it
    if (correctAnswer === answersList[index]) {
      onCorrectAnswerChange('');
    }
  };

  const handleCorrectAnswerSelect = (answer: string) => {
    onCorrectAnswerChange(answer);
  };

  return (
    <div className="w-full space-y-4">
      <div>
        <label className='block text-sm font-medium text-gray-700 mb-2'>
          Answer Options <span className="text-red-500">*</span>
        </label>
        <div className="space-y-3">
          {answersList.map((answer, index) => (
            <div key={index} className="flex items-start gap-2">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="correctAnswer"
                    checked={correctAnswer === answer && answer !== ''}
                    onChange={() => handleCorrectAnswerSelect(answer)}
                    disabled={!answer}
                    className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500"
                    title="Mark as correct answer"
                  />
                  <input
                    type="text"
                    value={answer}
                    onChange={(e) => handleAnswerChange(index, e.target.value)}
                    placeholder={`Answer ${index + 1}`}
                    className={`flex-1 px-3 py-2 border ${errors?.answers ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                  />
                  {answersList.length > 2 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveAnswer(index)}
                      className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-md transition-colors text-sm font-medium"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        {errors?.answers && (
          <p className="mt-1 text-sm text-red-600">{errors.answers}</p>
        )}
        <button
          type="button"
          onClick={handleAddAnswer}
          className="mt-3 px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-md transition-colors border border-blue-300"
        >
          + Add Another Answer
        </button>
      </div>

      <div className="p-3 bg-blue-50 rounded-md border border-blue-200">
        <p className="text-sm text-blue-800">
          <strong>Correct Answer:</strong> {correctAnswer || 'Not selected'}
        </p>
        {errors?.correctAnswer && (
          <p className="mt-1 text-sm text-red-600">{errors.correctAnswer}</p>
        )}
        <p className="mt-1 text-xs text-blue-600">
          Select the radio button next to the correct answer
        </p>
      </div>
    </div>
  );
}

