import { withPageAuth } from '@/lib/app-access-control/interceptors';
import { StaffCardsListWidget } from '../(widgets)/StaffCardsListWidget';

function StaffCardsListPage() {
  return <StaffCardsListWidget />;
}

export default withPageAuth(
  StaffCardsListPage,
  {
    path: '/workspaces/staff/:workspaceId/cards',
  }
);
