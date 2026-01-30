import { StaffPageEditWidget } from '@/app/[locale]/workspaces/staff/[workspaceId]/pages/(widgets)/StaffPageEditWidget';
import { withPageAuth } from '@/lib/app-access-control/interceptors';

function StaffPrivacyEditPage() {
  return <StaffPageEditWidget title="Privacy" />;
}

export default withPageAuth(
  StaffPrivacyEditPage,
  {
    path: '/workspaces/staff/:workspaceId/pages/privacy',
  }
);
