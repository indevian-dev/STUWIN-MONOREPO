"use client";

import { useEffect, useState } from 'react';
import { AuthLoginWidget } from '@/app/[locale]/auth/login/(widgets)/AuthLogin.widget';
import { fetchApiUtil } from '@/lib/utils/Http.FetchApiSPA.util';
import { useRouter } from 'next/navigation';
import { GlobalLoaderTile } from '@/app/[locale]/(global)/(tiles)/GlobalLoader.tile';

const AuthLoginPage = () => {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

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
      // If we get here, user is not logged in
      setChecking(false);
    } catch (e) {
      // Error checking auth, assume not logged in
      setChecking(false);
    } finally {
      // Removed finally block to prevent clearing loading state during redirect
    }
  };

  if (checking) {
    return <GlobalLoaderTile fullPage={true} message="Authenticating..." />;
  }

  return (
    <AuthLoginWidget />
  );
};

export default AuthLoginPage;