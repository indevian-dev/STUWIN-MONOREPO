import { StudentBookmarkedQuestionsListWidget } from '@/app/[locale]/workspaces/student/[workspaceId]/bookmarks/(widgets)/StudentBookmarkedQuestionsList.widget';
import { withPageAuth } from "@/lib/middleware/_Middleware.index";

function StudentFavoritesListPage() {
  return (
    <div>
      <StudentBookmarkedQuestionsListWidget />
    </div>
  );
}

export default withPageAuth(
  StudentFavoritesListPage,
  {
    path: '/workspaces/student/:workspaceId/favorites',
  }
);

