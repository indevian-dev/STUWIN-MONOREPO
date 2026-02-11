import { StudentPageTitleWidget } from '@/app/[locale]/workspaces/student/[workspaceId]/(widgets)/StudentPageTitleWidget';
import { StudentStartQuizWidget } from '@/app/[locale]/workspaces/student/[workspaceId]/quizzes/(widgets)/StudentStartQuizWidget';
import { withPageAuth } from '@/lib/middleware/handlers';

function StudentStartQuizPage() {
  return (
    <div className='space-y-6'>
      <StudentPageTitleWidget pageTitle='Start New Quiz' />
      <StudentStartQuizWidget />
    </div>
  );
}

export default withPageAuth(
  StudentStartQuizPage,
  {
    path: '/workspaces/student/:workspaceId/quizzes/start',
  }
);

