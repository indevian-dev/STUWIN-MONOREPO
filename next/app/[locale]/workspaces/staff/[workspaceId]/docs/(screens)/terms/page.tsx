import { StaffDocEditWidget } from '@/app/[locale]/workspaces/staff/[workspaceId]/docs/(widgets)/StaffDocEdit.widget';
import { withPageAuth } from '@/lib/middleware/_Middleware.index';

function StaffTermsEditPage() {
  return <StaffDocEditWidget title="Terms" />;
}

export default withPageAuth(
  StaffTermsEditPage,
  {
    path: '/workspaces/staff/:workspaceId/docs/terms',
  }
);
