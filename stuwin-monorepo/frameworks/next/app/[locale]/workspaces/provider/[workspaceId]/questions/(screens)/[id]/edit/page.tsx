import { withPageAuth } from "@/lib/app-access-control/interceptors";
import ProviderEditQuestionPageClient from './ProviderEditQuestionPageClient';

function ProviderEditQuestionPage() {
  return <ProviderEditQuestionPageClient />;
}

export default withPageAuth(
  ProviderEditQuestionPage,
  {
    path: '/workspaces/provider/:workspaceId/questions/update/:id',
  }
);
