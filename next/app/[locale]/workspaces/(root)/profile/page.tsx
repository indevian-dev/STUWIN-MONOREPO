import { withPageAuth } from '@/lib/middleware/_Middleware.index';
import { WorkspaceProfileEditWidget } from './(widgets)/WorkspaceProfileEdit.widget';

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
