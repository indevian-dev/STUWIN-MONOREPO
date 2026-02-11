import { StudentPageTitleWidget } from "@/app/[locale]/workspaces/student/[workspaceId]/(widgets)/StudentPageTitleWidget";
import { withPageAuth } from '@/lib/middleware/handlers';

function StudentRootPage() {
  return (
    <div>
      <StudentPageTitleWidget pageTitle="stuwin.ai Student Dashboard" />
    </div>
  );
}

export default withPageAuth(StudentRootPage, {
  path: '/workspaces/student/:workspaceId',
});
