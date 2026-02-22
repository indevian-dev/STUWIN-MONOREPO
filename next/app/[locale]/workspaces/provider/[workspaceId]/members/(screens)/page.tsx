import { ProviderMembersWidget } from '@/app/[locale]/workspaces/provider/[workspaceId]/members/(widgets)/ProviderMembers.widget';
import { WorkspacePageTitleTile } from '@/app/[locale]/workspaces/(root)/(tiles)/WorkspacePageTitle.tile';
import { withPageAuth } from '@/lib/middleware/_Middleware.index';
import { PiUsersBold } from 'react-icons/pi';

function ProviderMembersPage() {
    return (
        <div className="p-4 md:p-6">
            <WorkspacePageTitleTile
                title="Members"
                subtitle="Manage your workspace staff and team members"
                icon={<PiUsersBold />}
                action={null}
                className="mb-6"
            />
            <ProviderMembersWidget />
        </div>
    );
}

export default withPageAuth(
    ProviderMembersPage,
    {
        path: '/workspaces/provider/:workspaceId/members',
    }
);
