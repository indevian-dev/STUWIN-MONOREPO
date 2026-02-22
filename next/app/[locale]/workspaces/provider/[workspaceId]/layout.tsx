import { withLayoutAuth } from '@/lib/middleware/_Middleware.index';
import { ProviderLayoutClient } from './ProviderLayoutClient';
import type { ReactNode } from 'react';
import type { ClientAuthData } from '@stuwin/shared/types/auth/AuthData.types';

interface ProviderLayoutProps {
  children: ReactNode;
  params: Promise<{ locale: string;[key: string]: string }>;
  clientAuth?: ClientAuthData | null;
}

/**
 * Provider Layout - Server Component
 * Validates auth at layout level so UI never renders for unauthorized users
 */
async function ProviderLayout({ children, clientAuth }: ProviderLayoutProps) {
  return (
    <ProviderLayoutClient authData={clientAuth ?? null}>
      {children}
    </ProviderLayoutClient>
  );
}

export default withLayoutAuth(ProviderLayout, {
  path: '/workspaces/provider/:workspaceId',
});
