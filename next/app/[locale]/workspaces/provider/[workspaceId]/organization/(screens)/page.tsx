import { withPageAuth } from "@/lib/middleware/handlers";
import ProviderOrganizationPageClient from "../ProviderOrganizationPageClient";

function ProviderOrganizationPage() {
  return <ProviderOrganizationPageClient />;
}

export default withPageAuth(ProviderOrganizationPage, {
  path: "/workspaces/provider/:workspaceId/organization",
});
