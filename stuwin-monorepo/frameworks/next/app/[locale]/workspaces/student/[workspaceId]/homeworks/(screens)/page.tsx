import { StudentHomeworksListWidget } from "@/app/[locale]/workspaces/student/[workspaceId]/homeworks/(widgets)/StudentHomeworksListWidget";
import { withPageAuth } from "@/lib/app-access-control/interceptors";

function StudentHomeworksPage() {
  return (
    <div>
      <StudentHomeworksListWidget />
    </div>
  );
}

export default withPageAuth(StudentHomeworksPage, {
  path: "/workspaces/student/:workspaceId/homeworks",
});
