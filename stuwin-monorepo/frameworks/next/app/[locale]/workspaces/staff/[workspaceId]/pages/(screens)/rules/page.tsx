import { StaffPageEditWidget } from '@/app/[locale]/workspaces/staff/[workspaceId]/pages/(widgets)/StaffPageEditWidget';
import { withPageAuth } from '@/lib/app-access-control/interceptors';

function StaffRulesEditPage() {
  return <StaffPageEditWidget title="Rules" />;
}

export default withPageAuth(
  StaffRulesEditPage,
  {
    path: '/workspaces/staff/:workspaceId/pages/rules',
  }
);
