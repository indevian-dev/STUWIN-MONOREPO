import { StudentPageTitleWidget } from "@/app/[locale]/workspaces/student/[workspaceId]/(widgets)/StudentPageTitle.widget";
import { withPageAuth } from '@/lib/middleware/_Middleware.index';

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
