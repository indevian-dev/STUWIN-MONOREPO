import { withPageAuth } from '@/lib/middleware/_Middleware.index';
import { WorkspacesRootPageClient } from './WorkspacesRootPageClient';

interface WorkspacesRootPageProps {
    params: Promise<{
        locale: string;
    }>;
}

/**
 * Workspaces Root Page - Server Component
 * Displays list of user workspaces and allows creating new ones
 */
async function WorkspacesRootPage({ params }: WorkspacesRootPageProps) {
    await params;
    return <WorkspacesRootPageClient />;
}

export default withPageAuth(WorkspacesRootPage, {
    path: '/workspaces',
});
