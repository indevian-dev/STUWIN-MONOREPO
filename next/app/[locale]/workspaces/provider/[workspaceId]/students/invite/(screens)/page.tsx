import { withPageAuth } from "@/lib/middleware/_Middleware.index";
import ProviderInviteStudentsPageClient from '../ProviderInviteStudentsPageClient';

function ProviderInviteStudentsPage() {
  return <ProviderInviteStudentsPageClient />;
}

export default withPageAuth(
  ProviderInviteStudentsPage,
  {
    path: '/workspaces/provider/:workspaceId/students/invite',
  }
);




