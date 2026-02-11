import { withPageAuth } from "@/lib/middleware/handlers";
import ProviderCreateQuestionPageClient from './ProviderCreateQuestionPageClient';

function ProviderCreateQuestionPage() {
  return <ProviderCreateQuestionPageClient />;
}

export default withPageAuth(
  ProviderCreateQuestionPage,
  {
    path: '/workspaces/provider/:workspaceId/questions/create',
  }
);
