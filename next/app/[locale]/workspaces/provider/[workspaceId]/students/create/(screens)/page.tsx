import { withPageAuth } from "@/lib/middleware/handlers";
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




