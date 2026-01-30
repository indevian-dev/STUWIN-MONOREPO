'use client'

import { Link } from '@/i18n/routing';
import { useTranslations } from 'next-intl';

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
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="max-w-md w-full space-y-6 text-center">
        <div className="space-y-3">
          <div className="mx-auto w-14 h-14 bg-red-50 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-red-600"
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
          <h2 className="text-xl font-semibold text-gray-900">
            {title || t('access_denied')}
          </h2>
          <p className="text-gray-600 text-sm">
            {message || t('no_permission')}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="px-5 py-2 bg-white border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors text-sm"
          >
            {t('go_home')}
          </Link>
          <Link
            href={`/auth/login?redirect=${encodeURIComponent(returnUrl)}`}
            className="px-5 py-2 bg-brand text-white rounded-md hover:bg-brand/90 transition-colors text-sm"
          >
            {t('login')}
          </Link>
        </div>
      </div>
    </div>
  );
}





