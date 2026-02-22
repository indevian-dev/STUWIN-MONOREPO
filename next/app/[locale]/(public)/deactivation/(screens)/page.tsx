'use client';

import dynamic
  from 'next/dynamic';

const PublicDeactivationFormWidget = dynamic(() => import('@/app/[locale]/(public)/deactivation/(widgets)/PublicDeactivationForm.widget'), {
  ssr: false,
});

export default function PublicDeactivationPage() {
  return <PublicDeactivationFormWidget />;
}