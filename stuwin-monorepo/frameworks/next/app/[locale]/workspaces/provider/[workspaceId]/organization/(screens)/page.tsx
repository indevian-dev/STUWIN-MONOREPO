import { withPageAuth } from "@/lib/app-access-control/interceptors";
import ProviderOrganizationPageClient from "../ProviderOrganizationPageClient";

function ProviderOrganizationPage() {
  return <ProviderOrganizationPageClient />;
}

export default withPageAuth(ProviderOrganizationPage, {
  path: "/workspaces/provider/:workspaceId/organization",
});
