import { withLayoutAuth } from '@/lib/middleware/handlers';
import type { ReactNode } from 'react';
import { WorkspaceRootLayoutClient } from './WorkspaceRootLayoutClient';

interface RootWorkspaceLayoutProps {
    children: ReactNode;
    params: Promise<{
        locale: string;
        workspaceId?: string;
    }>;
}

/**
 * Root Workspace Layout - Only for selection and profile
 * Hosts the WorkspaceRootLayoutClient shell
 */
async function RootWorkspaceLayout({ children, params }: RootWorkspaceLayoutProps) {
    // Await the params promise
    await params;

    return (
        <WorkspaceRootLayoutClient>
            {children}
        </WorkspaceRootLayoutClient>
    );
}

// Ensure it's auth protected
export default withLayoutAuth(RootWorkspaceLayout, {
    path: '/workspaces',
});
