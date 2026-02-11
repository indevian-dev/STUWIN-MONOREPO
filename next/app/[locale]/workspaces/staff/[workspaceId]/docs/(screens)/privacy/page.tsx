import { StaffDocEditWidget } from '@/app/[locale]/workspaces/staff/[workspaceId]/docs/(widgets)/StaffDocEditWidget';
import { withPageAuth } from '@/lib/middleware/handlers';

function StaffPrivacyEditPage() {
  return <StaffDocEditWidget title="Privacy" type="privacy" />;
}

export default withPageAuth(
  StaffPrivacyEditPage,
  {
    path: '/workspaces/staff/:workspaceId/docs/privacy',
  }
);
