import { StudentHomeworkDetailWidget } from "@/app/[locale]/workspaces/student/[workspaceId]/homeworks/(widgets)/StudentHomeworkDetail.widget";
import { withPageAuth } from "@/lib/middleware/_Middleware.index";

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
