import { withPageAuth } from '@/lib/middleware/handlers';
import ProviderStudentsPageClient from '../ProviderStudentsPageClient';

function ProviderStudentsPage() {
  return <ProviderStudentsPageClient />;
}

export default withPageAuth(
  ProviderStudentsPage,
  {
    path: '/workspaces/provider/:workspaceId/students',
  }
);




