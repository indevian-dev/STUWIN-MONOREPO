import { StaffDocEditWidget } from '@/app/[locale]/workspaces/staff/[workspaceId]/docs/(widgets)/StaffDocEdit.widget';
import { withPageAuth } from '@/lib/middleware/_Middleware.index';

function StaffPrivacyEditPage() {
  return <StaffDocEditWidget title="Privacy" type="privacy" />;
}

export default withPageAuth(
  StaffPrivacyEditPage,
  {
    path: '/workspaces/staff/:workspaceId/docs/privacy',
  }
);
