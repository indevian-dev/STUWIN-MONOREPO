import { withPageAuth } from '@/lib/app-access-control/interceptors';
import { AuthProfileEditWidget } from './(widgets)/AuthProfileEditWidget';

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

    return <AuthProfileEditWidget />;
}

export default withPageAuth(ProfilePage, {
    path: '/workspaces/profile',
});
