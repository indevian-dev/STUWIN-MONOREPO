import { StudentBookmarkedQuestionsListWidget } from '@/app/[locale]/workspaces/student/[workspaceId]/bookmarks/(widgets)/StudentBookmarkedQuestionsListWidget';
import { withPageAuth } from "@/lib/app-access-control/interceptors";

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

