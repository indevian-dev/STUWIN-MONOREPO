import { withPageAuth } from "@/lib/app-access-control/interceptors";
import ProviderQuestionsPageClient from "./ProviderQuestionsPageClient";

function ProviderQuestionsPage() {
  return <ProviderQuestionsPageClient />;
}

export default withPageAuth(ProviderQuestionsPage, {
  path: "/workspaces/provider/:workspaceId/questions",
});
