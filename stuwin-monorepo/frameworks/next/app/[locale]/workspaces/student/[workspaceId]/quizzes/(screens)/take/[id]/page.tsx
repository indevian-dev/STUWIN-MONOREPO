import { withPageAuth } from '@/lib/app-access-control/interceptors';
import StudentTakeQuizPageClient from './StudentTakeQuizPageClient';

function StudentTakeQuizPage() {
  return <StudentTakeQuizPageClient />;
}

export default withPageAuth(
  StudentTakeQuizPage,
  {
    path: '/workspaces/student/:workspaceId/quizzes/take/:id',
  }
);
