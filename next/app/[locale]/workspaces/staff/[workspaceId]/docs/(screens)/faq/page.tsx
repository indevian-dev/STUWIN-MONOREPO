import { StaffDocEditWidget } from '@/app/[locale]/workspaces/staff/[workspaceId]/docs/(widgets)/StaffDocEditWidget';
import { withPageAuth } from '@/lib/middleware/handlers';

function StaffFaqEditPage() {
  return <StaffDocEditWidget title="Faq" />;
}

export default withPageAuth(
  StaffFaqEditPage,
  {
    path: '/workspaces/staff/:workspaceId/docs/faq',
  }
);
