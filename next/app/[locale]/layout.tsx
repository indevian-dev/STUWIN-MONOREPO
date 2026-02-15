
import 'react-toastify/dist/ReactToastify.css';
import '../globals.css';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { GlobalToastProvider } from '@/app/[locale]/(global)/(providers)/GlobalToastProvider';
import { GlobalAuthProfileProvider } from '@/app/[locale]/(global)/(context)/GlobalAuthProfileContext';
import { GlobalTwoFactorAuthProvider } from '@/app/[locale]/(global)/(context)/GlobalTwoFactorAuthContext';
import { GlobalTwoFactorAuthModal } from '@/app/[locale]/(global)/(tiles)/GlobalTwoFactorAuthModal';
import type { ReactNode } from 'react';

interface LocaleLayoutProps {
  children: ReactNode;
  params: Promise<{ locale: string;[key: string]: string }>;
}

/**
 * Locale Layout - Server Component (Public)
 * Provides internationalization and global context providers
 * This is a public layout - no auth required
 */
async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const resolvedParams = await params;
  const messages = await getMessages({ locale: resolvedParams.locale });

  return (
    <html lang={resolvedParams.locale}>
      <body className='bg-white text-dark overflow-y-scroll min-h-screen bg-section-gradient-brand'>
        <NextIntlClientProvider locale={resolvedParams.locale} messages={messages}>
          <div className='absolute top-0 left-0 w-0 h-0'>
            <GlobalToastProvider />
          </div>
          <GlobalAuthProfileProvider>
            <GlobalTwoFactorAuthProvider>
              {children}
              <GlobalTwoFactorAuthModal />
            </GlobalTwoFactorAuthProvider>
          </GlobalAuthProfileProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

export default LocaleLayout;