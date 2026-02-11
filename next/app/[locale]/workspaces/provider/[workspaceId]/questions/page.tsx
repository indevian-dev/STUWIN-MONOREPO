import { withPageAuth } from "@/lib/middleware/handlers";
import ProviderQuestionsPageClient from "./(screens)/ProviderQuestionsPageClient";

function ProviderQuestionsPage() {
  return <ProviderQuestionsPageClient />;
}

export default withPageAuth(ProviderQuestionsPage, {
  path: "/workspaces/provider/:workspaceId/questions",
});
