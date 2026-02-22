import { StudentHomeworkUploadWidget } from "@/app/[locale]/workspaces/student/[workspaceId]/homeworks/(widgets)/StudentHomeworkUpload.widget";
import { withPageAuth } from "@/lib/middleware/_Middleware.index";

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
