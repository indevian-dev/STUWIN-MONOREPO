"use client";

import {
  useState,
  useEffect
} from 'react';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'react-toastify';
import { apiCallForSpaHelper } from '@/lib/helpers/apiCallForSpaHelper';
import { useTranslations } from 'next-intl';

import { ConsoleLogger } from '@/lib/app-infrastructure/loggers/ConsoleLogger';

interface Subject {
  id: string;
  title: string;
}

export function StudentStartQuizWidget() {
  const t = useTranslations('Quiz');
  const router = useRouter();
  const params = useParams();
  const workspaceId = params.workspaceId as string;

  const [loading, setLoading] = useState(false);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [formData, setFormData] = useState({
    subjectId: '',
    gradeLevel: '',
    complexity: '',
    questionCount: '25',
    language: ''
  });

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    const response = await apiCallForSpaHelper({
      method: 'GET',
      url: '/api/subjects',
    });

    if (response.status === 200) {
      setSubjects(response.data.subjects || []);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleStartQuiz = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await apiCallForSpaHelper({
        method: 'POST',
        url: `/api/workspaces/student/${workspaceId}/quizzes/start`,
        body: {
          subjectId: formData.subjectId || null,
          gradeLevel: formData.gradeLevel || null,
          complexity: formData.complexity || null,
          questionCount: parseInt(formData.questionCount) || 25,
          language: formData.language || null
        }
      });

      if (response.status === 200) {
        toast.success('Quiz started successfully!');
        // Navigate to quiz taking page with quiz ID
        router.push(`/workspaces/student/${workspaceId}/quizzes/take/${response.data.quiz.id}`);
      } else {
        toast.error(response.data?.error || 'Failed to start quiz');
      }
    } catch (error) {
      ConsoleLogger.error('Error starting quiz:', error);
      toast.error('Failed to start quiz');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='w-full max-w-2xl mx-auto'>
      <div className='bg-white rounded-lg shadow-md p-6'>
        <h2 className='text-2xl font-bold text-gray-800 mb-6'>
          Start New Quiz
        </h2>

        <form onSubmit={handleStartQuiz} className='space-y-6'>
          {/* Subject Selection */}
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Subject (Optional)
            </label>
            <select
              name='subjectId'
              value={formData.subjectId}
              onChange={handleChange}
              className='w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand focus:border-transparent'
            >
              <option value=''>All Subjects</option>
              {subjects.map(subject => (
                <option key={subject.id} value={subject.id}>
                  {subject.title}
                </option>
              ))}
            </select>
          </div>

          {/* Grade Level */}
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Grade Level (Optional)
            </label>
            <select
              name='gradeLevel'
              value={formData.gradeLevel}
              onChange={handleChange}
              className='w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand focus:border-transparent'
            >
              <option value=''>All Grades</option>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(grade => (
                <option key={grade} value={grade}>
                  Grade {grade}
                </option>
              ))}
            </select>
          </div>

          {/* Complexity */}
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Complexity (Optional)
            </label>
            <select
              name='complexity'
              value={formData.complexity}
              onChange={handleChange}
              className='w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand focus:border-transparent'
            >
              <option value=''>All Levels</option>
              <option value='easy'>Easy</option>
              <option value='medium'>Medium</option>
              <option value='hard'>Hard</option>
            </select>
          </div>

          {/* Question Count */}
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Number of Questions
            </label>
            <input
              type='number'
              name='questionCount'
              value={formData.questionCount}
              onChange={handleChange}
              min='1'
              max='25'
              className='w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand focus:border-transparent'
            />
            <p className='text-xs text-gray-500 mt-1'>
              Maximum 25 questions
            </p>
          </div>

          {/* Language */}
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Language (Optional)
            </label>
            <select
              name='language'
              value={formData.language}
              onChange={handleChange}
              className='w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand focus:border-transparent'
            >
              <option value=''>All Languages</option>
              <option value='azerbaijani'>Azerbaijani</option>
              <option value='english'>English</option>
              <option value='russian'>Russian</option>
            </select>
          </div>

          {/* Submit Button */}
          <button
            type='submit'
            disabled={loading}
            className='w-full py-3 px-6 bg-brand text-white font-semibold rounded-md hover:bg-brand-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
          >
            {loading ? (
              <span className='flex items-center justify-center'>
                <svg className='animate-spin -ml-1 mr-3 h-5 w-5 text-white' xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24'>
                  <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4'></circle>
                  <path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'></path>
                </svg>
                Starting Quiz...
              </span>
            ) : (
              'Start Quiz'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

