import { StaffPageEditWidget } from "@/app/[locale]/workspaces/staff/[workspaceId]/pages/(widgets)/StaffPageEditWidget";
import { withPageAuth } from "@/lib/app-access-control/interceptors";

function StaffAboutEditPage() {
  return <StaffPageEditWidget title="About us" />;
}

export default withPageAuth(StaffAboutEditPage, {
  path: "/workspaces/staff/:workspaceId/pages/about",
});
