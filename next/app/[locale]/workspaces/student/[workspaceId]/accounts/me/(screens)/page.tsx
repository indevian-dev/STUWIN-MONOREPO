import StudentMyAccountWidget from "@/app/[locale]/workspaces/student/[workspaceId]/accounts/(widgets)/StudentMyAccountWidget";
import { withPageAuth } from "@/lib/middleware/handlers";

function StudentMyAccountPage() {
  return <StudentMyAccountWidget />;
}

export default withPageAuth(StudentMyAccountPage, {
  path: "/workspaces/student/:workspaceId/accounts/me",
});
