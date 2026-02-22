import { withPageAuth } from '@/lib/middleware/_Middleware.index';
import StudentQuizResultsPageClient from './StudentQuizResultsPageClient';

function StudentQuizResultsPage() {
  return <StudentQuizResultsPageClient />;
}

export default withPageAuth(
  StudentQuizResultsPage,
  {
    path: '/workspaces/student/:workspaceId/quizzes/results/:id',
  }
);
