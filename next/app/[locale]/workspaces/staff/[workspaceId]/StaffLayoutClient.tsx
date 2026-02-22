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
  PiArticle,
  PiFile,
  PiKey,
  PiStorefront,
  PiPlugs,
  PiPackage,
  PiEnvelope,
  PiUsersFill,
  PiGrainsFill,
  PiStorefrontFill,
  PiClock,
  PiRobot,
  PiBuilding,
  PiGraduationCap,
  PiUsersThree
} from 'react-icons/pi';

import { FiBell } from 'react-icons/fi';
import { GlobalHeaderWidget } from '@/app/[locale]/(global)/(widgets)/GlobalHeader.widget';
import { GlobalFastNavigationWidget } from '@/app/[locale]/(global)/(widgets)/GlobalFastNavigation.widget';
import { GlobalFullNavigationWidget } from '@/app/[locale]/(global)/(widgets)/GlobalFullNavigation.widget';
import { Main } from '@/app/primitives/Main.primitive';
import { Container } from '@/app/primitives/Container.primitive';

import type { ClientAuthData } from '@stuwin/shared/types/auth/AuthData.types';
import type { DomainNavConfig } from '@stuwin/shared/types/ui/Navigation.types';

// Context for auth data in console pages
export const StaffAuthContext = createContext<ClientAuthData | null>(null);

export function useConsoleAuth(): ClientAuthData {
  const context = useContext(StaffAuthContext);
  if (!context) {
    throw new Error('useConsoleAuth must be used within StaffLayoutClient');
  }
  return context;
}

interface StaffLayoutClientProps {
  children: ReactNode;
  authData: ClientAuthData | null;
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
          { href: `/workspaces/staff/${workspaceId}/providers/applications`, icon: PiStorefrontFill, label: 'provider_applications' },
          { href: `/workspaces/staff/${workspaceId}/workspaces/staff`, icon: PiBuilding, label: 'staff_workspaces' },
          { href: `/workspaces/staff/${workspaceId}/workspaces/student`, icon: PiGraduationCap, label: 'student_workspaces' },
          { href: `/workspaces/staff/${workspaceId}/workspaces/parent`, icon: PiUsersThree, label: 'parent_workspaces' },
          { href: `/workspaces/staff/${workspaceId}/manage-workspaces`, icon: PiPlugs, label: 'workspaces' },
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
        Notifications
      </span>
    </div>
  );

  return (
    <StaffAuthContext.Provider value={authData}>
      <div className="min-h-screen bg-section-gradient-app">
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

        <Main variant="app">
          <Container variant="7xl" className="flex items-start h-full max-w-7xl mx-auto gap-4 px-4">
            <aside className="hidden lg:flex shrink-0 sticky top-[70px] min-h-[calc(100vh-70px)] overflow-hidden w-64 flex-col">
              <GlobalFullNavigationWidget
                config={navConfig}
                isMenuOpen={isMenuOpen}
                setIsMenuOpen={setIsMenuOpen}
              />
            </aside>
            <div className="flex-1 min-w-0 w-full">
              {children}
            </div>
          </Container>
        </Main>
      </div>
    </StaffAuthContext.Provider>
  );
}
