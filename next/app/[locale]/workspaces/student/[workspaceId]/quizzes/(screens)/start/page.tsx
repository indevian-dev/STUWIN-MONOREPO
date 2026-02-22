import { StudentPageTitleWidget } from '@/app/[locale]/workspaces/student/[workspaceId]/(widgets)/StudentPageTitle.widget';
import { StudentStartQuizWidget } from '@/app/[locale]/workspaces/student/[workspaceId]/quizzes/(widgets)/StudentStartQuiz.widget';
import { withPageAuth } from '@/lib/middleware/_Middleware.index';

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

