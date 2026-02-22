import { StaffDocEditWidget } from '@/app/[locale]/workspaces/staff/[workspaceId]/docs/(widgets)/StaffDocEdit.widget';
import { withPageAuth } from '@/lib/middleware/_Middleware.index';

function StaffRulesEditPage() {
  return <StaffDocEditWidget title="Rules" />;
}

export default withPageAuth(
  StaffRulesEditPage,
  {
    path: '/workspaces/staff/:workspaceId/docs/rules',
  }
);
