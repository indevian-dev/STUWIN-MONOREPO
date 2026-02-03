'use client';

import React, {
  useState,
  createContext,
  useContext,
  ReactNode
} from 'react';
import { useParams } from 'next/navigation';
import {
  PiNotebook,
  PiUsers,
  PiPlugs,
  PiPackage,
  PiKey,
  PiFile,
  PiArticle,
  PiAcorn,
  PiStorefront,
  PiEnvelope,
  PiUsersFill,
  PiGrainsFill,
  PiStorefrontFill,
  PiClock,
  PiRobot
} from 'react-icons/pi';

import { FiBell } from 'react-icons/fi';
import { GlobalHeaderWidget } from '@/app/[locale]/(global)/(widgets)/GlobalHeaderWidget';
import { GlobalFastNavigationWidget } from '@/app/[locale]/(global)/(widgets)/GlobalFastNavigationWidget';
import { GlobalFullNavigationWidget } from '@/app/[locale]/(global)/(widgets)/GlobalFullNavigationWidget';
import { StaffRunningStrokeTile } from '@/app/[locale]/workspaces/staff/[workspaceId]/(layout)/header/(tiles)/StaffRunningStrokeTile';
import { loadClientSideCoLocatedTranslations } from '@/i18n/i18nClientSide';
import type { AuthData } from '@/types';
import type { DomainNavConfig } from '@/types';

// Context for auth data in console pages
export const StaffAuthContext = createContext<AuthData | null>(null);

export function useConsoleAuth(): AuthData {
  const context = useContext(StaffAuthContext);
  if (!context) {
    throw new Error('useConsoleAuth must be used within StaffLayoutClient');
  }
  return context;
}

interface StaffLayoutClientProps {
  children: ReactNode;
  authData: AuthData | null;
}

/**
 * Console Layout Client Component
 * Renders the console/admin UI shell with unified navigation
 * Only rendered after server-side auth validation passes
 */
export function StaffLayoutClient({
  children,
  authData
}: StaffLayoutClientProps) {
  const params = useParams();
  const workspaceId = (params?.workspaceId as string) || "";
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const { t } = loadClientSideCoLocatedTranslations('StaffHeaderWidget');

  const notificationsLabel = t('notifications') || 'Notifications';

  const navConfig: DomainNavConfig = {
    domain: 'staff',
    logoSrc: '/stuwinlogo.svg',
    label: 'STUWIN.AI',
    subtitle: 'Console',
    fastNavLinks: [],
    menuGroups: {
      content: {
        label: 'content_management',
        items: [
          { href: `/workspaces/staff/${workspaceId}/blogs`, icon: PiArticle, label: 'blogs' },
          { href: `/workspaces/staff/${workspaceId}/docs/faq`, icon: PiFile, label: 'faq' },
          { href: `/workspaces/staff/${workspaceId}/docs/terms`, icon: PiFile, label: 'terms_of_service' },
          { href: `/workspaces/staff/${workspaceId}/docs/privacy`, icon: PiFile, label: 'privacy_policy' },
          { href: `/workspaces/staff/${workspaceId}/docs/about`, icon: PiFile, label: 'about_us' },
          { href: `/workspaces/staff/${workspaceId}/docs/rules`, icon: PiFile, label: 'rules' }
        ]
      },
      access_management: {
        label: 'access_management',
        icon: PiKey,
        items: [
          { href: `/workspaces/staff/${workspaceId}/providers`, icon: PiStorefront, label: 'providers' },
          { href: `/workspaces/staff/${workspaceId}/providers/applications`, icon: PiStorefrontFill, label: 'provider_applications' }
        ]
      },
      users: {
        label: 'users_management',
        icon: PiUsersFill,
        items: [
          { href: `/workspaces/staff/${workspaceId}/roles`, icon: PiGrainsFill, label: 'roles' },
          { href: `/workspaces/staff/${workspaceId}/users`, icon: PiUsersFill, label: 'users' }
        ]
      },
      subjects_catalog: {
        label: 'subjects',
        icon: PiNotebook,
        items: [
          { href: `/workspaces/staff/${workspaceId}/subjects`, icon: PiNotebook, label: 'subjects' }
        ]
      },
      ai_management: {
        label: 'ai_lab',
        icon: PiRobot,
        items: [
          { href: `/workspaces/staff/${workspaceId}/ai-lab`, icon: PiRobot, label: 'system_prompts' }
        ]
      },
      catalog: {
        label: 'services_statuses',
        icon: PiPackage,
        items: [
          { href: `/workspaces/staff/${workspaceId}/mail`, icon: PiEnvelope, label: 'mail_service' },
          { href: `/workspaces/staff/${workspaceId}/jobs`, icon: PiClock, label: 'background_jobs' }
        ]
      }
    },
    menuDisplayMode: {
      desktop: 'sidebar',
      mobile: 'mobile-modal'
    }
  };

  const NotificationBadge = () => (
    <div className="relative inline-flex items-center gap-2 rounded bg-neutral-100 px-3 py-2 hover:-translate-y-0.5 transition">
      <FiBell className="text-lg" />
      <span className="hidden sm:block text-sm font-semibold">
        {notificationsLabel}
      </span>
    </div>
  );

  return (
    <StaffAuthContext.Provider value={authData}>
      <div className="min-h-screen bg-section-gradient-brand">
        <GlobalHeaderWidget
          config={navConfig}
          isMenuOpen={isMenuOpen}
          setIsMenuOpen={setIsMenuOpen}
        >
          <GlobalFastNavigationWidget
            config={navConfig}
            isMenuOpen={isMenuOpen}
            setIsMenuOpen={setIsMenuOpen}
          />
        </GlobalHeaderWidget>

        <main className="layout-main-grid justify-start items-start">
          <nav className="col-span-5 md:col-span-1 rounded relative">
            <GlobalFullNavigationWidget
              config={navConfig}
              isMenuOpen={isMenuOpen}
              setIsMenuOpen={setIsMenuOpen}
            />
          </nav>
          <div className="col-span-5 md:col-span-4 rounded">
            {children}
          </div>
        </main>
      </div>
    </StaffAuthContext.Provider>
  );
}
