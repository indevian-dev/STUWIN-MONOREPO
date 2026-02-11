import { StaffManageWorkspacesWidget } from '@/app/[locale]/workspaces/staff/[workspaceId]/manage-workspaces/(widgets)/StaffManageWorkspacesWidget';
import { withPageAuth } from '@/lib/middleware/handlers';

function StaffManageWorkspacesPage() {
    return (
        <div>
            <h1 className="text-3xl font-black text-left my-4 px-4">
                Workspaces
            </h1>
            <StaffManageWorkspacesWidget />
        </div>
    );
}
export default withPageAuth(
    StaffManageWorkspacesPage,
    {
        path: '/workspaces/staff/:workspaceId/manage-workspaces',
    }
);
