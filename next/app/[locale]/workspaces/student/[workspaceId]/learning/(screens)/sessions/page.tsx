import { StudentLearningSessionsListWidget } from "@/app/[locale]/workspaces/student/[workspaceId]/learning/(widgets)/StudentLearningSessionsList.widget";
import { withPageAuth } from "@/lib/middleware/_Middleware.index";

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
