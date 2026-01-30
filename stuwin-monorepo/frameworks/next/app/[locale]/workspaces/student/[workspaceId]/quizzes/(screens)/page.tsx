
import { StudentPageTitleWidget } from '@/app/[locale]/workspaces/student/[workspaceId]/(widgets)/StudentPageTitleWidget';
import { StudentQuizHistoryListWidget } from '@/app/[locale]/workspaces/student/[workspaceId]/quizzes/(widgets)/StudentQuizHistoryListWidget';
import { withPageAuth } from '@/lib/app-access-control/interceptors';

function StudentQuizzesPage() {


  return (
    <div className='space-y-6'>
      <div className='flex justify-between items-center'>
        <StudentPageTitleWidget pageTitle='My Quizzes' />
      </div>
      <StudentQuizHistoryListWidget />
    </div>
  );
}

export default withPageAuth(
  StudentQuizzesPage,
  {
    path: '/workspaces/student/:workspaceId/quizzes',
  }
);

