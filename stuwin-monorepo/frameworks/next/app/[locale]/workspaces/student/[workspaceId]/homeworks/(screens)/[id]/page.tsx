import { StudentHomeworkDetailWidget } from "@/app/[locale]/workspaces/student/[workspaceId]/homeworks/(widgets)/StudentHomeworkDetailWidget";
import { withPageAuth } from "@/lib/app-access-control/interceptors";

function StudentHomeworkDetailPage() {
  return (
    <div>
      <StudentHomeworkDetailWidget />
    </div>
  );
}

export default withPageAuth(StudentHomeworkDetailPage, {
  path: "/workspaces/student/:workspaceId/homeworks/:id",
});
