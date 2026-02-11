import { withPageAuth } from '@/lib/middleware/handlers';
import { WorkspaceProfileEditWidget } from './(widgets)/WorkspaceProfileEditWidget';

interface ProfilePageProps {
    params: Promise<{
        locale: string;
    }>;
}

/**
 * Profile Page - Server Component
 * Hosts the profile editing widget
 */
async function ProfilePage({ params }: ProfilePageProps) {
    await params;

    return <WorkspaceProfileEditWidget />;
}

export default withPageAuth(ProfilePage, {
    path: '/workspaces/profile',
});
