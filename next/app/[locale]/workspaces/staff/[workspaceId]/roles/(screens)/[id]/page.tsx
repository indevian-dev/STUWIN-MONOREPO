import { StaffSingleRoleWidget } from '@/app/[locale]/workspaces/staff/[workspaceId]/roles/(widgets)/StaffSingleRole.widget';
import { withPageAuth } from '@/lib/middleware/_Middleware.index';

import { ConsoleLogger } from '@/lib/logging/Console.logger';
async function StaffSingleRolePage({ params }: { params: Promise<{ id: string; locale: string }> }) {
  const { id } = await params;
  const roleId = id;
  ConsoleLogger.log(roleId);
  return (
    <div>
      <h1 className="text-3xl font-black text-left my-4 px-4">
        Rol
      </h1>
      <StaffSingleRoleWidget id={roleId} />
    </div>
  );
}

export default withPageAuth(
  StaffSingleRolePage,
  {
    path: '/workspaces/staff/:workspaceId/roles/:id',
  }
);
