import { StudentPageTitleWidget } from "@/app/[locale]/workspaces/student/[workspaceId]/(widgets)/StudentPageTitleWidget";
import { withPageAuth } from '@/lib/app-access-control/interceptors';

function StudentRootPage() {
  return (
    <div>
      <StudentPageTitleWidget pageTitle="Shagguide Student Dashboard" />
    </div>
  );
}

export default withPageAuth(StudentRootPage, {
  path: '/workspaces/student/:workspaceId',
});
