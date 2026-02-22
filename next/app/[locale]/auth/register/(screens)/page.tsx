'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { fetchApiUtil } from '@/lib/utils/Http.FetchApiSPA.util';
import { GlobalLoaderTile } from '@/app/[locale]/(global)/(tiles)/GlobalLoader.tile';

const AuthRegisterWidget = dynamic(() => import('@/app/[locale]/auth/register/(widgets)/AuthRegister.widget'), {
  ssr: false,
});

export default function AuthRegisterPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);


  const checkAuth = async () => {
    try {
      const response = await fetchApiUtil<any>({
        url: '/api/auth',
        method: 'GET'
      });

      const data = response as any;
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



  useEffect(() => {
    checkAuth();
  }, []);


  if (checking) {
    return <GlobalLoaderTile fullPage={true} message="Preparing Registration..." />;
  }

  return <AuthRegisterWidget />;
}