"use client";

import {
  useState,
  useEffect
} from 'react';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'react-toastify';
import { fetchApiUtil } from '@/lib/utils/Http.FetchApiSPA.util';
import { useTranslations } from 'next-intl';
import { GlobalLoaderTile } from '@/app/[locale]/(global)/(tiles)/GlobalLoader.tile';

import { ConsoleLogger } from '@/lib/logging/Console.logger';

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
    try {
      const response = await fetchApiUtil<any>({
        method: 'GET',
        url: `/api/workspaces/student/${workspaceId}/subjects`,
      });

      console.log('[StudentStartQuiz] subjects response:', response.status, response.data);

      if (response.status === 200) {
        const subjectsData = response.data?.data || [];
        console.log('[StudentStartQuiz] parsed subjects:', subjectsData.length, subjectsData);
        setSubjects(subjectsData);
      }
    } catch (error) {
      console.error('[StudentStartQuiz] fetchSubjects error:', error);
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
      const response = await fetchApiUtil<any>({
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
        router.push(`/workspaces/student/${workspaceId}/quizzes/take/${response.data?.data?.id}`);
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
      {loading && <GlobalLoaderTile fullPage={true} message="Preparing your quiz..." />}
      <div className='bg-white rounded-app shadow-md p-6'>
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
              className='w-full px-4 py-2 border border-gray-300 rounded-app focus:ring-2 focus:ring-app focus:border-transparent'
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
              className='w-full px-4 py-2 border border-gray-300 rounded-app focus:ring-2 focus:ring-app focus:border-transparent'
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
              className='w-full px-4 py-2 border border-gray-300 rounded-app focus:ring-2 focus:ring-app focus:border-transparent'
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
              className='w-full px-4 py-2 border border-gray-300 rounded-app focus:ring-2 focus:ring-app focus:border-transparent'
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
              className='w-full px-4 py-2 border border-gray-300 rounded-app focus:ring-2 focus:ring-app focus:border-transparent'
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
            className='w-full py-3 px-6 bg-app-bright-green text-white font-semibold rounded-app hover:bg-app-bright-green-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
          >
            {loading ? 'Starting Quiz...' : 'Start Quiz'}
          </button>
        </form>
      </div>
    </div>
  );
}

