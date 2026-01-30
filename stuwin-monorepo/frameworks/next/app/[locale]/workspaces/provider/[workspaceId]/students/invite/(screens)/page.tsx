import { withPageAuth } from "@/lib/app-access-control/interceptors";
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




