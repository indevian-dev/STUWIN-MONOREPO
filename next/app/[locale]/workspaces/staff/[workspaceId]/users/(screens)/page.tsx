import { StaffUsersListWidget } from '@/app/[locale]/workspaces/staff/[workspaceId]/users/(widgets)/StaffUsersListWidget';
import { withPageAuth } from '@/lib/middleware/handlers';

function StaffUsersListPage() {
  return (
    <div>
      <h1 className="text-3xl font-black text-left my-4 px-4">
        İstifadəçilər
      </h1>
      <StaffUsersListWidget />
    </div>
  );
}
export default withPageAuth(
  StaffUsersListPage,
  {
    path: '/workspaces/staff/:workspaceId/users',
  }
);
