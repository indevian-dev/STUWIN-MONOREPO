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
import { GlobalHeaderWidget } from '@/app/[locale]/(global)/(widgets)/GlobalHeaderWidget';
import { GlobalFastNavigationWidget } from '@/app/[locale]/(global)/(widgets)/GlobalFastNavigationWidget';
import { GlobalFullNavigationWidget } from '@/app/[locale]/(global)/(widgets)/GlobalFullNavigationWidget';
import { PublicFooterWidget } from '@/app/[locale]/(public)/(layout)/footer/(widgets)/PublicFooterWidget';
import type { DomainNavConfig } from '@/types';


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
          { href: '/eduorgs', icon: PiStorefront, label: 'educational_organizations' }
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
        <GlobalFullNavigationWidget
          config={navConfig}
          isMenuOpen={isMenuOpen}
          setIsMenuOpen={setIsMenuOpen}
        />
        <main className="text-dark">{children}</main>
        <PublicFooterWidget />
      </div>
    </>
  );
}

// Metadata marker for prebuild script detection
PublicLayout.__isProtectedLayout = true;
PublicLayout.__layoutPath = '/public';
PublicLayout.__isPublic = true;

export default PublicLayout;
