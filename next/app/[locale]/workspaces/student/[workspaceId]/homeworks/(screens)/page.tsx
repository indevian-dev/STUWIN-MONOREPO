import { StudentHomeworksListWidget } from "@/app/[locale]/workspaces/student/[workspaceId]/homeworks/(widgets)/StudentHomeworksList.widget";
import { withPageAuth } from "@/lib/middleware/_Middleware.index";

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
