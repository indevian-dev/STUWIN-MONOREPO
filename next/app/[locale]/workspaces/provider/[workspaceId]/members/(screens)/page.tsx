import { ProviderMembersWidget } from '@/app/[locale]/workspaces/provider/[workspaceId]/members/(widgets)/ProviderMembersWidget';
import { withPageAuth } from '@/lib/middleware/handlers';

function ProviderMembersPage() {
    return (
        <div>
            <h1 className="text-3xl font-black text-left my-4 px-4">
                Members
            </h1>
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
