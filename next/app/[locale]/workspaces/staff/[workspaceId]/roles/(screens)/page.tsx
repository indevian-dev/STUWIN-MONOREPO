import { StaffRolesListWidget } from '@/app/[locale]/workspaces/staff/[workspaceId]/roles/(widgets)/StaffRolesList.widget';
import { withPageAuth } from '@/lib/middleware/_Middleware.index';

function StaffRolesListPage() {
  return (
    <div>
      <h1 className="text-3xl font-black text-left my-4 px-4">
        Rol Ləistəsi
      </h1>
      <StaffRolesListWidget />
    </div>
  );
}

export default withPageAuth(
  StaffRolesListPage,
  {
    path: '/workspaces/staff/:workspaceId/roles',
  }
);

