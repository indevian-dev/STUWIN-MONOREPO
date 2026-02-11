'use client';

import React from 'react';
import { DomainNavConfig } from '@/types';
import { GlobalLangSwitcherTile } from '@/app/[locale]/(global)/(tiles)/GlobalLangSwitcherTile';
import { GlobalLogoTile } from '@/app/[locale]/(global)/(tiles)/GlobalLogoTile';

interface GlobalHeaderWidgetProps {
  config: DomainNavConfig;
  isMenuOpen: boolean;
  setIsMenuOpen: (isOpen: boolean) => void;
  children?: React.ReactNode;
}

/**
 * Global Header Widget
 * Provides consistent header structure across all domains
 * with domain-specific branding and menu toggle
 */
export function GlobalHeaderWidget({
  config,
  isMenuOpen,
  setIsMenuOpen,
  children
}: GlobalHeaderWidgetProps) {
  const { logoSrc, label, subtitle } = config;

  return (
    <>
      <header className="sticky top-0 z-20 w-full bg-linear-to-b from-white/95 via-white/90 to-white/70">
        <nav className="z-20 text-dark max-w-7xl mx-auto flex items-center justify-between gap-4 px-4 py-3">
          <GlobalLogoTile width={180} height={60} className="translate-y-1" href="/" />
          {/* Center section - Custom content (e.g., running stroke, search) */}
          {children && children}

          {/* Right section - Language switcher (always in header) */}
          <div className="flex items-center gap-3 px-4">
            <GlobalLangSwitcherTile />
          </div>
        </nav>
      </header>
    </>
  );
}

