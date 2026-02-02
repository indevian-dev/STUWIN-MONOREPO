"use client";

import { useEffect, useState } from 'react';
import { AuthLoginWidget } from '@/app/[locale]/auth/login/(widgets)/AuthLoginWidget';
import { apiCallForSpaHelper } from '@/lib/helpers/apiCallForSpaHelper';
import { useRouter } from 'next/navigation';

const AuthLoginPage = () => {
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
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <AuthLoginWidget />
  );
};

export default AuthLoginPage;