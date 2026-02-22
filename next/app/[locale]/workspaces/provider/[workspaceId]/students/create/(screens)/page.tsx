import { withPageAuth } from "@/lib/middleware/_Middleware.index";
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




