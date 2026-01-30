import { withLayoutAuth } from '@/lib/app-access-control/interceptors';
import { ProviderLayoutClient } from './ProviderLayoutClient';
import type { ReactNode } from 'react';
import type { AuthData } from '@/types';

interface ProviderLayoutProps {
  children: ReactNode;
  params: Promise<{ locale: string;[key: string]: string }>;
  authData?: AuthData | null;
}

/**
 * Provider Layout - Server Component
 * Validates auth at layout level so UI never renders for unauthorized users
 */
async function ProviderLayout({ children, authData }: ProviderLayoutProps) {
  return (
    <ProviderLayoutClient authData={authData ?? null}>
      {children}
    </ProviderLayoutClient>
  );
}

export default withLayoutAuth(ProviderLayout, {
  path: '/workspaces/provider/:workspaceId',
});

