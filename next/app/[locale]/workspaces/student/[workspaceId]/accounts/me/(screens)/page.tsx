import StudentMyAccountWidget from "@/app/[locale]/workspaces/student/[workspaceId]/accounts/(widgets)/StudentMyAccount.widget";
import { withPageAuth } from "@/lib/middleware/_Middleware.index";

function StudentMyAccountPage() {
  return <StudentMyAccountWidget />;
}

export default withPageAuth(StudentMyAccountPage, {
  path: "/workspaces/student/:workspaceId/accounts/me",
});
