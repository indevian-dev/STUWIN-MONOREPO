import { withPageAuth } from '@/lib/app-access-control/interceptors';
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




