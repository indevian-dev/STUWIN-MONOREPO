import { withPageAuth } from "@/lib/middleware/handlers";
import ProviderGenerateQuestionsPageClient from "./ProviderGenerateQuestionsPageClient";

function ProviderGenerateQuestionsPage() {
  return <ProviderGenerateQuestionsPageClient />;
}

export default withPageAuth(ProviderGenerateQuestionsPage, {
  path: "/workspaces/provider/:workspaceId/questions/generate",
});
