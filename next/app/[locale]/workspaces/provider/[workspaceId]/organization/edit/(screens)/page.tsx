import { withPageAuth } from "@/lib/middleware/_Middleware.index";
import ProviderOrganizationEditPageClient from "../ProviderOrganizationEditPageClient";

function ProviderOrganizationEditPage() {
  return <ProviderOrganizationEditPageClient />;
}

export default withPageAuth(ProviderOrganizationEditPage, {
  path: "/workspaces/provider/:workspaceId/organization/edit",
});
