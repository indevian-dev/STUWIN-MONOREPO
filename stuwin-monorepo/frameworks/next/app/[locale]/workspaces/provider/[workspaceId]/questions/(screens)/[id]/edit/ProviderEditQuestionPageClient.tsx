"use client";

import {
  useState,
  useEffect
} from 'react';
import { ProviderQuestionFormWidget } from '@/app/[locale]/workspaces/provider/[workspaceId]/questions/(widgets)/ProviderQuestionFormWidget';
import { StaffPageTitleTile } from '@/app/[locale]/workspaces/staff/[workspaceId]/(tiles)/StaffPageTitleTile';
import {
  useRouter,
  useParams
} from 'next/navigation';
import { Link } from '@/i18n/routing';
import { apiCallForSpaHelper } from '@/lib/helpers/apiCallForSpaHelper';
import { toast } from 'react-toastify';

import { ConsoleLogger } from '@/lib/app-infrastructure/loggers/ConsoleLogger';
interface Question {
  id: string;
  createdAt: string;
  updatedAt: string | null;
  question: string;
  answers: string[];
  correctAnswer: string;
  authorAccountId: string;
  reviewerAccountId: string | null;
  topic: string | null;
  subjectId: string;
  complexity: string;
  gradeLevel: string;
  explanationGuide: string | null;
  language: string;
  subjectTitle: string | null;
  subjectSlug: string | null;
  authorEmail: string | null;
  authorId: string | null;
  reviewerEmail: string | null;
  reviewerId: string | null;
  created_at?: string;
  author_email?: string;
  subject_title?: string;
}

export default function ProviderEditQuestionPageClient() {
  const router = useRouter();
  const params = useParams();
  const questionId = params.id;

  const [question, setQuestion] = useState<Question | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (questionId) {
      fetchQuestion();
    }
  }, [questionId]);

  const fetchQuestion = async () => {
    setLoading(true);
    try {
      const response = await apiCallForSpaHelper({
        method: 'GET',
        url: `/api/workspaces/provider/questions/${questionId}`,
        params: {},
        body: {}
      });

      if (response.status === 200) {
        setQuestion(response.data.question);
      } else {
        toast.error('Failed to load question');
        router.push('/provider/questions');
      }
    } catch (error) {
      ConsoleLogger.error('Error fetching question:', error);
      toast.error('An error occurred while loading the question');
      router.push('/provider/questions');
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = () => {
    toast.success('Question updated successfully');
    router.push('/provider/questions');
  };

  const handleCancel = () => {
    router.push('/provider/questions');
  };

  if (loading || isLoading) return <GlobalLoaderTile message="Loading question..." />;

  if (!question) {
    return (
      <div className='w-full min-h-screen bg-gray-50 p-6'>
        <div className='max-w-4xl mx-auto'>
          <div className='text-center py-12'>
            <p className='text-gray-600'>Question not found</p>
            <Link
              href='/provider/questions'
              className='mt-4 inline-block text-blue-600 hover:text-blue-700'
            >
              ← Back to Questions
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='w-full min-h-screen bg-gray-50 p-6'>
      <div className='max-w-4xl mx-auto'>
        {/* Page Header */}
        <div className='mb-6'>
          <div className='flex items-center gap-2 mb-4'>
            <Link
              href='/provider/questions'
              className='text-blue-600 hover:text-blue-700'
            >
              ← Back to Questions
            </Link>
          </div>
          <StaffPageTitleTile pageTitle='Edit Question' />
          <p className='mt-2 text-gray-600'>
            Update question details and answers
          </p>
        </div>

        {/* Question Details */}
        <div className='mb-4 p-4 bg-white rounded-lg border border-gray-200'>
          <div className='grid grid-cols-2 gap-4 text-sm'>
            <div>
              <span className='text-gray-500'>Question ID:</span>
              <span className='ml-2 font-medium'>{question.id}</span>
            </div>
            <div>
              <span className='text-gray-500'>Created:</span>
              <span className='ml-2 font-medium'>
                {new Date(question.createdAt || question.created_at || '').toLocaleDateString()}
              </span>
            </div>
            {(question.authorEmail || question.author_email) && (
              <div>
                <span className='text-gray-500'>Author:</span>
                <span className='ml-2 font-medium'>{question.authorEmail || question.author_email}</span>
              </div>
            )}
            {(question.subjectTitle || question.subject_title) && (
              <div>
                <span className='text-gray-500'>Subject:</span>
                <span className='ml-2 font-medium'>{question.subjectTitle || question.subject_title}</span>
              </div>
            )}
          </div>
        </div>

        {/* Question Form */}
        <ProviderQuestionFormWidget
          mode='edit'
          initialData={{
            id: question.id,
            body: question.question,
            subject_id: question.subjectId,
            grade_level: parseInt(question.gradeLevel),
            complexity: question.complexity as 'easy' | 'medium' | 'hard',
            answers: question.answers,
            correct_answer: question.correctAnswer,
            explanation_guide: question.explanationGuide
          }}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
}

