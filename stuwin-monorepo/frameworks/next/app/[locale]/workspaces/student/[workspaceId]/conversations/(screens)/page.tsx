import { withPageAuth } from "@/lib/app-access-control/interceptors";
import StudentConversationsListPageClient from './StudentConversationsListPageClient';

function StudentConversationsListPage() {
  return <StudentConversationsListPageClient />;
}

export default withPageAuth(
  StudentConversationsListPage,
  {
    path: '/workspaces/student/:workspaceId/conversations',
  }
);
