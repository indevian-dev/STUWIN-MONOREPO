import { StaffDocEditWidget } from "@/app/[locale]/workspaces/staff/[workspaceId]/docs/(widgets)/StaffDocEditWidget";
import { StaffPageTitleTile } from "@/app/[locale]/workspaces/staff/[workspaceId]/(tiles)/StaffPageTitleTile";

import { withPageAuth } from "@/lib/middleware/handlers";

function StaffAboutEditPage() {
  return (
    <>
      <StaffPageTitleTile pageTitle="About us" />
      <StaffDocEditWidget type="about" title="About us" />
    </>
  );
}


export default withPageAuth(StaffAboutEditPage, {
  path: "/workspaces/staff/:workspaceId/docs/about",
});
