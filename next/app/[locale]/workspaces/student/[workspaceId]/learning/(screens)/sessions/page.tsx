import { StudentLearningSessionsListWidget } from "@/app/[locale]/workspaces/student/[workspaceId]/learning/(widgets)/StudentLearningSessionsListWidget";
import { withPageAuth } from "@/lib/middleware/handlers";

function StudentLearningSessionsPage() {
  return (
    <div>
      <StudentLearningSessionsListWidget />
    </div>
  );
}

export default withPageAuth(StudentLearningSessionsPage, {
  path: "/workspaces/student/:workspaceId/learning/sessions",
});
