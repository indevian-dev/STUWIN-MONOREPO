import { withPageAuth } from '@/lib/middleware/handlers';
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
