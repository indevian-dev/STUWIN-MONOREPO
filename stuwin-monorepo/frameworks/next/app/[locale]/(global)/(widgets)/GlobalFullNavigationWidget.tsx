
'use client';

import React, { useEffect } from 'react';
import { Link, useRouter } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { DomainNavConfig, NavItem, MenuDisplayMode } from '@/types';
import { GlobalProfileWidget } from '@/app/[locale]/(global)/(widgets)/GlobalProfileWidget';
import { GlobalSubscriptionStatusWidget } from '@/app/[locale]/(global)/(widgets)/GlobalSubscriptionStatusWidget';
import { useGlobalAuthProfileContext } from '@/app/[locale]/(global)/(context)/GlobalAuthProfileContext';
import { PiSignOutBold } from 'react-icons/pi';
import { FiArrowRight } from 'react-icons/fi';
import { IoClose } from 'react-icons/io5';
import { IconType } from 'react-icons';

import { ConsoleLogger } from '@/lib/app-infrastructure/loggers/ConsoleLogger';

interface GlobalFullNavigationWidgetProps {
  config: DomainNavConfig;
  isMenuOpen: boolean;
  setIsMenuOpen: (isOpen: boolean) => void;
  displayMode?: MenuDisplayMode;
}

interface MenuItemProps {
  href: string;
  icon: IconType;
  label: string;
  disabled?: boolean;
  onClick: () => void;
}

/**
 * Global Full Navigation Widget
 * Displays complete navigation menu with 3 responsive modes:
 * - dropdown: Modal under header (public domain desktop)
 * - sidebar: Left sidebar (authenticated domains desktop)
 * - mobile-modal: Full-screen modal (all domains mobile)
 */
export function GlobalFullNavigationWidget({
  config,
  isMenuOpen,
  setIsMenuOpen,
  displayMode
}: GlobalFullNavigationWidgetProps) {
  const t = useTranslations('GlobalFullNavigationWidget');
  const router = useRouter();
  const { clearProfile, userId } = useGlobalAuthProfileContext();
  const { menuGroups, domain } = config;

  // Use the display mode from config (no runtime window checks to avoid hydration issues)
  const desktopMode = displayMode || config.menuDisplayMode.desktop;
  const isPublicDomain = domain === 'public';
  const isAuthenticated = !!userId;

  // Close menu on route change
  useEffect(() => {
    const handleRouteChange = () => setIsMenuOpen(false);
    return () => {
      handleRouteChange();
    };
  }, [setIsMenuOpen]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isMenuOpen]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      clearProfile();
      router.push('/');
    } catch (error) {
      ConsoleLogger.error('Logout failed:', error);
    }
  };

  const MenuItem: React.FC<MenuItemProps> = ({ href, icon: Icon, label, disabled, onClick }) => (
    <li className="text-left w-full">
      {disabled ? (
        <span
          className="text-sm flex items-center rounded text-gray-400 cursor-not-allowed px-3 py-2.5"
          aria-disabled="true"
        >
          <Icon className="mr-2.5 text-gray-300 text-lg" />
          {t(label)}
        </span>
      ) : (
        <Link
          href={href}
          className="text-sm flex items-center rounded text-dark hover:text-dark hover:bg-light px-3 py-2.5 font-medium transition-all duration-200"
          onClick={onClick}
        >
          <Icon className="mr-2.5 text-brand text-lg" />
          {t(label)}
        </Link>
      )}
    </li>
  );

  const renderMenuContent = () => (
    <>
      {/* Profile tile for authenticated domains */}
      {isAuthenticated && (
        <li className="text-left w-full bg-linear-to-b from-white/95 to-white/80 rounded">
          <GlobalProfileWidget />
          <GlobalSubscriptionStatusWidget />
        </li>
      )}

      {/* Menu groups */}
      {Object.entries(menuGroups).map(([key, group]: [string, any]) => (
        <li
          key={key}
          className="text-left w-full bg-linear-to-b from-white/95 to-white/80 rounded"
        >
          <div className="w-full text-[11px] flex items-center gap-2 font-bold text-ink-muted uppercase tracking-wider px-4 pt-4 pb-2">
            {group.icon && <group.icon className="text-neutral-900" />}
            {t(group.label)}
          </div>
          <ul className="pb-3 px-2 space-y-0.5">
            {group.items.map((item: NavItem, index: number) => (
              <MenuItem
                key={index}
                {...item}
                onClick={() => setIsMenuOpen(false)}
              />
            ))}
          </ul>
        </li>
      ))}

      {/* Logout button for authenticated domains */}
      {domain !== 'public' && (
        <li className="text-left w-full">
          <button
            className="w-full inline-flex items-center justify-center gap-2 font-semibold text-white rounded-full bg-brand px-4 py-3 shadow-2xl shadow-dark/10 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
            onClick={handleLogout}
          >
            <PiSignOutBold className="text-base" />
            {t('logout')}
            <FiArrowRight className="text-sm" />
          </button>
        </li>
      )}
    </>
  );

  // PUBLIC DROPDOWN MODE - Under header (desktop), mobile modal (mobile)
  if (isPublicDomain) {
    return (
      <>
        {/* Desktop dropdown */}
        {isMenuOpen && (
          <div className="hidden lg:block overflow-y-scroll overflow-x-hidden transform backdrop-blur-md fixed transition duration-500 ease-in-out top-0 right-0 left-0 text-dark h-screen bg-neutral-900/20 z-10">
            <ul className="pt-20 pb-40 px-4 text-dark max-w-7xl mx-auto">
              {renderMenuContent()}
            </ul>
          </div>
        )}

        {/* Mobile modal */}
        <div
          className={`lg:hidden fixed inset-0 z-50 bg-white/95 backdrop-blur-md ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'
            } transition-transform duration-300 overflow-y-auto`}
        >
          {/* Close button */}
          <button
            onClick={() => setIsMenuOpen(false)}
            className="absolute top-4 right-4 z-50 p-2 rounded-full bg-white/80 hover:bg-white shadow-lg hover:shadow-xl transition-all duration-200"
            aria-label="Close menu"
          >
            <IoClose className="text-2xl text-dark" />
          </button>

          <div className="px-4 pt-20 pb-8">
            <ul className="flex-col justify-center items-center space-y-3">
              {renderMenuContent()}
            </ul>
          </div>
        </div>
      </>
    );
  }

  // AUTHENTICATED DOMAINS - Sidebar (desktop), mobile modal (mobile)
  return (
    <>
      {/* Desktop sidebar */}
      <div
        className={`hidden lg:block ${isMenuOpen ? 'translate-x-0 opacity-100' : 'lg:translate-x-0 lg:opacity-100'
          } transition-all duration-500`}
      >
        <ul className="flex-col justify-center items-center space-y-3">
          {renderMenuContent()}
        </ul>
      </div>

      {/* Mobile modal */}
      <div
        className={`lg:hidden fixed inset-0 z-50 bg-white/95 backdrop-blur-md ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'
          } transition-transform duration-300 overflow-y-auto`}
      >
        {/* Close button */}
        <button
          onClick={() => setIsMenuOpen(false)}
          className="absolute top-4 right-4 z-50 p-2 rounded-full bg-white/80 hover:bg-white shadow-lg hover:shadow-xl transition-all duration-200"
          aria-label="Close menu"
        >
          <IoClose className="text-2xl text-dark" />
        </button>

        <div className="px-4 pt-20 pb-8">
          <ul className="flex-col justify-center items-center space-y-3">
            {renderMenuContent()}
          </ul>
        </div>
      </div>
    </>
  );
}
