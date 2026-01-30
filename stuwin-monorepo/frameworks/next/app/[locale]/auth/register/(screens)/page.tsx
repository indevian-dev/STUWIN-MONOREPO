'use client';

import dynamic
  from 'next/dynamic';

const AuthRegisterWidget = dynamic(() => import('@/app/[locale]/auth/register/(widgets)/AuthRegisterWidget'), {
  ssr: false,
});

export default function AuthRegisterPage() {
  return <AuthRegisterWidget />;
}