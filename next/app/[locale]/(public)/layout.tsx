'use client';

import React, { useState } from 'react';
import {
  PiSquaresFourLight,
  PiBookBookmarkLight,
  PiExamLight,
  PiHouseLine,
  PiSignIn,
  PiUserPlus,
  PiFilePdf,
  PiStorefront,
  PiEnvelopeSimple
} from 'react-icons/pi';
import { GlobalHeaderWidget } from '@/app/[locale]/(global)/(widgets)/GlobalHeader.widget';
import { GlobalFastNavigationWidget } from '@/app/[locale]/(global)/(widgets)/GlobalFastNavigation.widget';
import { GlobalFullNavigationWidget } from '@/app/[locale]/(global)/(widgets)/GlobalFullNavigation.widget';
import { PublicFooterWidget } from '@/app/[locale]/(public)/(layout)/footer/(widgets)/PublicFooter.widget';
import { Main } from '@/app/primitives/Main.primitive';
import { Container } from '@/app/primitives/Container.primitive';
import type { DomainNavConfig } from '@stuwin/shared/types/ui/Navigation.types';


interface PublicLayoutProps {
  children: React.ReactNode;
}

/**
 * Public Layout - Client Component (Public)
 * Handles public pages with unified navigation and footer
 * This is a public layout - no auth required
 * 
 * @withLayoutAuth { layoutPath: '/public', isPublic: true }
 */
function PublicLayout({ children }: PublicLayoutProps) {
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);

  const navConfig: DomainNavConfig = {
    domain: 'public',
    logoSrc: '/stuwinlogo.svg',
    label: 'STUWIN.AI',
    subtitle: 'Educational Platform',
    fastNavLinks: [
      {
        href: '/auth/login',
        icon: PiSignIn,
        label: 'login',
        variant: 'secondary',
        showOnMobile: true
      },
      {
        href: '/auth/register',
        icon: PiUserPlus,
        label: 'register',
        variant: 'primary',
        showOnMobile: true
      }
    ],
    menuGroups: {
      main: {
        label: 'main',
        items: [
          { href: '/', icon: PiHouseLine, label: 'home' },
          { href: '/subjects', icon: PiSquaresFourLight, label: 'subjects' },
          { href: '/programs', icon: PiStorefront, label: 'programs' }
        ]
      },
      resources: {
        label: 'resources',
        items: [
          { href: '/docs/about', icon: PiBookBookmarkLight, label: 'about_us' },
          { href: '/docs/faq', icon: PiExamLight, label: 'faq' },
          { href: '/docs/terms', icon: PiBookBookmarkLight, label: 'terms_of_service' },
          { href: '/docs/privacy', icon: PiBookBookmarkLight, label: 'privacy_policy' },
          { href: '/pdf-tool', icon: PiFilePdf, label: 'pdf_tools' },
        ]
      },
      contact: {
        label: 'contact',
        items: [
          { href: '/contact', icon: PiEnvelopeSimple, label: 'contact_us' }
        ]
      }
    },
    menuDisplayMode: {
      desktop: 'dropdown',
      mobile: 'mobile-modal'
    }
  };

  return (
    <>
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
      <GlobalFullNavigationWidget
        config={navConfig}
        isMenuOpen={isMenuOpen}
        setIsMenuOpen={setIsMenuOpen}
      />
      <Main className="text-app-dark-blue dark:text-white min-h-[calc(60vh-100px)]">
        <Container variant="full">
          {children}
        </Container>
      </Main>
      <PublicFooterWidget />
    </>
  );
}

// Metadata marker for prebuild script detection
PublicLayout.__isProtectedLayout = true;
PublicLayout.__layoutPath = '/public';
PublicLayout.__isPublic = true;

export default PublicLayout;
