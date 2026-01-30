import { StaffPageEditWidget } from '@/app/[locale]/workspaces/staff/[workspaceId]/pages/(widgets)/StaffPageEditWidget';
import { withPageAuth } from '@/lib/app-access-control/interceptors';

function StaffFaqEditPage() {
  return <StaffPageEditWidget title="Faq" />;
}

export default withPageAuth(
  StaffFaqEditPage,
  {
    path: '/workspaces/staff/:workspaceId/pages/faq',
  }
);
