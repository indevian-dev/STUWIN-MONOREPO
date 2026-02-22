import { StaffDocEditWidget } from '@/app/[locale]/workspaces/staff/[workspaceId]/docs/(widgets)/StaffDocEdit.widget';
import { withPageAuth } from '@/lib/middleware/_Middleware.index';

function StaffFaqEditPage() {
  return <StaffDocEditWidget title="Faq" />;
}

export default withPageAuth(
  StaffFaqEditPage,
  {
    path: '/workspaces/staff/:workspaceId/docs/faq',
  }
);
