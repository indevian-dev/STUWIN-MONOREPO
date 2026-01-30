import { withPageAuth } from "@/lib/app-access-control/interceptors";
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
