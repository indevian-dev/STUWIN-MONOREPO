import { StudentHomeworkUploadWidget } from "@/app/[locale]/workspaces/student/[workspaceId]/homeworks/(widgets)/StudentHomeworkUploadWidget";
import { withPageAuth } from "@/lib/app-access-control/interceptors";

function StudentHomeworkUploadPage() {
  return (
    <div>
      <StudentHomeworkUploadWidget />
    </div>
  );
}

export default withPageAuth(StudentHomeworkUploadPage, {
  path: "/workspaces/student/:workspaceId/homeworks/upload",
});
