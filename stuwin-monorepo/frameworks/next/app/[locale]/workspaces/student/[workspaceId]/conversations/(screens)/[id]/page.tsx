import { withPageAuth } from "@/lib/app-access-control/interceptors";
import StudentConversationPageClient from './StudentConversationPageClient';

function StudentConversationPage() {
  return <StudentConversationPageClient />;
}

export default withPageAuth(
  StudentConversationPage,
  {
    path: '/workspaces/student/:workspaceId/conversations/:id',
  }
);
