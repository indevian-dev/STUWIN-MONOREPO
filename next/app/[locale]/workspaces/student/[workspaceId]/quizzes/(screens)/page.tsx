
import { StudentPageTitleWidget } from '@/app/[locale]/workspaces/student/[workspaceId]/(widgets)/StudentPageTitle.widget';
import { StudentQuizHistoryListWidget } from '@/app/[locale]/workspaces/student/[workspaceId]/quizzes/(widgets)/StudentQuizHistoryList.widget';
import { withPageAuth } from '@/lib/middleware/_Middleware.index';

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

