import { StaffDocEditWidget } from "@/app/[locale]/workspaces/staff/[workspaceId]/docs/(widgets)/StaffDocEdit.widget";
import { StaffPageTitleTile } from "@/app/[locale]/workspaces/staff/[workspaceId]/(tiles)/StaffPageTitle.tile";

import { withPageAuth } from "@/lib/middleware/_Middleware.index";

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
