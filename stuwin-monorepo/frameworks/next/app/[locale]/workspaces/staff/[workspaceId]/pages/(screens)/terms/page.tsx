import { StaffPageEditWidget } from '@/app/[locale]/workspaces/staff/[workspaceId]/pages/(widgets)/StaffPageEditWidget';
import { withPageAuth } from '@/lib/app-access-control/interceptors';

function StaffTermsEditPage() {
  return <StaffPageEditWidget title="Terms" />;
}

export default withPageAuth(
  StaffTermsEditPage,
  {
    path: '/workspaces/staff/:workspaceId/pages/terms',
  }
);
