'use client'

import { useTranslations } from 'next-intl';
import { Button } from '@/app/primitives/Button.primitive';

interface GlobalInlineForbiddenWidgetProps {
  returnUrl?: string;
  title?: string;
  message?: string;
}

export default function GlobalInlineForbiddenWidget({
  returnUrl = '/',
  title,
  message
}: GlobalInlineForbiddenWidgetProps) {
  const t = useTranslations('GlobalInlineForbiddenWidget');

  return (
    <div className="flex flex-col items-center justify-center p-app-widget">
      <div className="max-w-md w-full space-y-6 text-center">
        <div className="space-y-3">
          <div className="mx-auto w-14 h-14 bg-app-bright-green-danger/10 rounded-app-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-app-bright-green-danger"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-app-dark-blue dark:text-white">
            {title || t('access_denied')}
          </h2>
          <p className="text-app-dark-blue/70 dark:text-white/70 text-sm">
            {message || t('no_permission')}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button variant="outline" isLink href="/">
            {t('go_home')}
          </Button>
          <Button variant="default" isLink href={`/auth/login?redirect=${encodeURIComponent(returnUrl)}`}>
            {t('login')}
          </Button>
        </div>
      </div>
    </div>
  );
}
