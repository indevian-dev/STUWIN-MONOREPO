import { withPageAuth } from "@/lib/app-access-control/interceptors";
import ProviderCreateStudentPageClient from '../ProviderCreateStudentPageClient';

function ProviderCreateStudentPage() {
  return <ProviderCreateStudentPageClient />;
}

export default withPageAuth(
  ProviderCreateStudentPage,
  {
    path: '/workspaces/provider/:workspaceId/students/create',
  }
);




