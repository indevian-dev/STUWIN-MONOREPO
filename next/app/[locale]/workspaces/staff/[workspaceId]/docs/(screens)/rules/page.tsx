import { StaffDocEditWidget } from '@/app/[locale]/workspaces/staff/[workspaceId]/docs/(widgets)/StaffDocEditWidget';
import { withPageAuth } from '@/lib/middleware/handlers';

function StaffRulesEditPage() {
  return <StaffDocEditWidget title="Rules" />;
}

export default withPageAuth(
  StaffRulesEditPage,
  {
    path: '/workspaces/staff/:workspaceId/docs/rules',
  }
);
