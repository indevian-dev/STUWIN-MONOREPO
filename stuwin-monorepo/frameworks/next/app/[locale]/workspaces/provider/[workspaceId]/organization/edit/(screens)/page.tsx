import { withPageAuth } from "@/lib/app-access-control/interceptors";
import ProviderOrganizationEditPageClient from "../ProviderOrganizationEditPageClient";

function ProviderOrganizationEditPage() {
  return <ProviderOrganizationEditPageClient />;
}

export default withPageAuth(ProviderOrganizationEditPage, {
  path: "/workspaces/provider/:workspaceId/organization/edit",
});
