import { withPageAuth } from "@/lib/middleware/_Middleware.index";
import ProviderOrganizationPageClient from "../ProviderOrganizationPageClient";

function ProviderOrganizationPage() {
  return <ProviderOrganizationPageClient />;
}

export default withPageAuth(ProviderOrganizationPage, {
  path: "/workspaces/provider/:workspaceId/organization",
});
