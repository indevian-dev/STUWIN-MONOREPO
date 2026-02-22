import { withPageAuth } from '@/lib/middleware/_Middleware.index';
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




