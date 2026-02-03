"use client";

import {
  useState,
  useEffect
} from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { apiCallForSpaHelper } from '@/lib/helpers/apiCallForSpaHelper';
import { StudentPageTitleWidget } from '@/app/[locale]/workspaces/student/[workspaceId]/(widgets)/StudentPageTitleWidget';
import { StudentQuizResultsWidget } from '@/app/[locale]/workspaces/student/[workspaceId]/quizzes/(widgets)/StudentQuizResultsWidget';
import { GlobalLoaderTile } from '@/app/[locale]/(global)/(tiles)/GlobalLoaderTile';

export default function StudentQuizResultsPageClient() {
  const params = useParams();
  const router = useRouter();
  const quizId = params.id as string;
  const workspaceId = params.workspaceId as string;

  const [loading, setLoading] = useState(true);
  const [quiz, setQuiz] = useState<any>(null);

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

      if (quizData.status !== 'completed') {
        toast.error('Quiz is not completed yet');
        router.push(`/workspaces/student/${workspaceId}/quizzes/take/${quizId}`);
      } else {
        setQuiz(quizData);
      }
    } else {
      toast.error('Failed to load quiz results');
      router.push(`/workspaces/student/${workspaceId}/quizzes`);
    }

    setLoading(false);
  };

  if (loading) return <GlobalLoaderTile message="Loading results..." />;

  if (!quiz) {
    return (
      <div className='text-center py-12'>
        <p className='text-gray-500'>Quiz not found</p>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <StudentPageTitleWidget pageTitle='Quiz Results' />
      <StudentQuizResultsWidget quiz={quiz} />
    </div>
  );
}


