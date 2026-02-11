'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { apiCallForSpaHelper } from '@/lib/utils/http/SpaApiClient';
import { GlobalLoaderTile } from '@/app/[locale]/(global)/(tiles)/GlobalLoaderTile';

const AuthRegisterWidget = dynamic(() => import('@/app/[locale]/auth/register/(widgets)/AuthRegisterWidget'), {
  ssr: false,
});

export default function AuthRegisterPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await apiCallForSpaHelper({
        url: '/api/auth',
        method: 'GET'
      });

      const data = response.data as any;
      if (data && data.user) {
        // User is already logged in
        router.replace('/workspaces');
        // Do NOT set checking to false here, keep showing loader until redirect happens
        return;
      }
      setChecking(false);
    } catch (e) {
      // Not logged in or error, provide access to register
      setChecking(false);
    }
  };

  if (checking) {
    return <GlobalLoaderTile fullPage={true} message="Preparing Registration..." />;
  }

  return <AuthRegisterWidget />;
}