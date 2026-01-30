import { withPageAuth } from "@/lib/app-access-control/interceptors";
import ProviderGenerateQuestionsPageClient from "./ProviderGenerateQuestionsPageClient";

function ProviderGenerateQuestionsPage() {
  return <ProviderGenerateQuestionsPageClient />;
}

export default withPageAuth(ProviderGenerateQuestionsPage, {
  path: "/workspaces/provider/:workspaceId/questions/generate",
});
