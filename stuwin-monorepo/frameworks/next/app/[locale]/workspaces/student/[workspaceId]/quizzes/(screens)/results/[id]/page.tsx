import { withPageAuth } from '@/lib/app-access-control/interceptors';
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
