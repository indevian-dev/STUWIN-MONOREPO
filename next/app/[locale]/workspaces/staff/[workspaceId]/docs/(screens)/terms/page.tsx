import { StaffDocEditWidget } from '@/app/[locale]/workspaces/staff/[workspaceId]/docs/(widgets)/StaffDocEditWidget';
import { withPageAuth } from '@/lib/middleware/handlers';

function StaffTermsEditPage() {
  return <StaffDocEditWidget title="Terms" />;
}

export default withPageAuth(
  StaffTermsEditPage,
  {
    path: '/workspaces/staff/:workspaceId/docs/terms',
  }
);
