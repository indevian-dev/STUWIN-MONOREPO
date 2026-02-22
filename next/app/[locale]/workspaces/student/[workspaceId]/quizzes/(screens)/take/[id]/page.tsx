import { withPageAuth } from '@/lib/middleware/_Middleware.index';
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
