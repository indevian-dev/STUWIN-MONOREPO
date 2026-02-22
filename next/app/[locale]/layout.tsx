
import 'react-toastify/dist/ReactToastify.css';
import '../globals.css';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { GlobalToastProvider } from '@/app/[locale]/(global)/(providers)/GlobalToast.provider';
import { GlobalAuthProfileProvider } from '@/app/[locale]/(global)/(context)/GlobalAuthProfileContext';
import { GlobalTwoFactorAuthProvider } from '@/app/[locale]/(global)/(context)/GlobalTwoFactorAuthContext';
import { GlobalTwoFactorAuthModal } from '@/app/[locale]/(global)/(tiles)/GlobalTwoFactorAuth.modal';
import { GlobalThemeProvider } from '@/app/[locale]/(global)/(providers)/GlobalTheme.provider';
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
    <html lang={resolvedParams.locale} suppressHydrationWarning>
      <body className='bg-neutral-100 dark:bg-app-dark-blue text-app-dark-blue dark:text-white overflow-y-scroll min-h-screen  '>
        <GlobalThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
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
        </GlobalThemeProvider>
      </body>
    </html>
  );
}

export default LocaleLayout;