import { GlobalSubjectsProvider } from '@/app/[locale]/(global)/(context)/GlobalSubjectsContext';
import { withLayoutAuth } from '@/lib/app-access-control/interceptors';
import type { ReactNode } from 'react';

interface WorkspaceLayoutProps {
  children: ReactNode;
  params: Promise<{
    locale: string;
    workspaceId?: string;
  }>;
}

/**
 * Workspace Layout - Server Component
 * The workspaceId from URL params is monitored by GlobalAuthProfileContext
 * which automatically syncs it to the current workspace when it changes
 */
async function WorkspaceLayout({ children, params }: WorkspaceLayoutProps) {
  // Await the params promise (Next.js 13+ behavior)
  await params;

  return (
    <GlobalSubjectsProvider>
      {children}
    </GlobalSubjectsProvider>
  );
}

export default withLayoutAuth(WorkspaceLayout, {
  path: '/workspaces',
});