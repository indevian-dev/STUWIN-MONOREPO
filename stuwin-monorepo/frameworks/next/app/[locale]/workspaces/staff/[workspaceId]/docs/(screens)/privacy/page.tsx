import { StaffDocEditWidget } from '@/app/[locale]/workspaces/staff/[workspaceId]/docs/(widgets)/StaffDocEditWidget';
import { withPageAuth } from '@/lib/app-access-control/interceptors';

function StaffPrivacyEditPage() {
  return <StaffDocEditWidget title="Privacy" />;
}

export default withPageAuth(
  StaffPrivacyEditPage,
  {
    path: '/workspaces/staff/:workspaceId/docs/privacy',
  }
);
