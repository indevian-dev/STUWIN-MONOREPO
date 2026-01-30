
'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Link } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { DomainNavConfig } from '@/types';
import { GlobalProfileAvatarTile } from '@/app/[locale]/(global)/(tiles)/GlobalProfileAvatarTile';
import { GlobalNotificationBadgeTile } from '@/app/[locale]/(global)/(tiles)/GlobalNotificationBadgeTile';
import { useGlobalAuthProfileContext } from '@/app/[locale]/(global)/(context)/GlobalAuthProfileContext';
import { FiMenu } from 'react-icons/fi';
import { PiXLight } from 'react-icons/pi';
import { FiBell } from 'react-icons/fi';

interface GlobalFastNavigationWidgetProps {
  config: DomainNavConfig;
  isMenuOpen: boolean;
  setIsMenuOpen: (isOpen: boolean) => void;
}

/**
 * Global Fast Navigation Widget
 * Displays quick action links and menu toggle button
 * Adapts based on domain configuration
 */
export function GlobalFastNavigationWidget({
  config,
  isMenuOpen,
  setIsMenuOpen
}: GlobalFastNavigationWidgetProps) {
  const t = useTranslations('GlobalFastNavigationWidget');
  const avatarRef = useRef<HTMLButtonElement>(null);
  const { userId } = useGlobalAuthProfileContext();
  const { fastNavLinks, domain } = config;

  const [hasMounted, setHasMounted] = useState(false);
  useEffect(() => {
    setHasMounted(true);
  }, []);

  const isPublic = domain === 'public';
  const isAuthenticated = !!userId;

  // Common bottom bar styling (mobile fixed, desktop relative)
  const bottomBarClasses = "fixed md:relative flex justify-between items-center gap-3 px-4 py-2 bottom-0 left-0 right-0 z-10 bg-white/70";
  const backdropBlurClasses = "w-full h-full backdrop-blur-md inset-0 absolute -z-1";

  if (isPublic) {
    return (
      <>
        {/* Desktop inline nav - part of header */}
        <div className={bottomBarClasses}>
          <div className={backdropBlurClasses} />
          {fastNavLinks.map((link: any, index: number) => {
            const Icon = link.icon;
            const variantClasses =
              link.variant === 'primary'
                ? 'bg-brand text-brand-secondary px-4 py-2 shadow-md hover:shadow-lg'
                : link.variant === 'secondary'
                  ? 'border border-bglight bg-white px-3 py-2 shadow-sm'
                  : 'bg-light text-dark px-3 py-2';

            return (
              <Link
                key={index}
                href={link.href}
                className={`inline-flex items-center gap-2 rounded hover:-translate-y-0.5 transition ${variantClasses}`}
                aria-label={t(link.label)}
              >
                <Icon className="text-2xl" />
                <span className="hidden lg:flex font-bold text-sm">
                  {t(link.label)}
                </span>
              </Link>
            );
          })}

          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="inline-flex items-center gap-2 bg-light text-dark rounded px-3 py-2 hover:-translate-y-0.5 transition"
            aria-label={t('menu')}
          >
            {isMenuOpen ? (
              <PiXLight className="text-dark text-2xl" />
            ) : (
              <FiMenu className="text-dark text-2xl" />
            )}
          </button>
        </div>
      </>
    );
  }

  // Authenticated domains (student, provider, staff)
  return (
    <>
      {/* Desktop inline nav - part of header */}
      <div className={bottomBarClasses}>
        <div className={backdropBlurClasses} />
        {/* Fast nav action links */}
        {fastNavLinks.map((link: any, index: number) => {
          const Icon = link.icon;
          const variantClasses =
            link.variant === 'primary'
              ? 'bg-brand text-brand-secondary px-4 py-2 shadow-md hover:shadow-lg'
              : 'border border-bglight bg-white px-3 py-2 shadow-sm';

          return (
            <Link
              key={index}
              href={link.href}
              className={`inline-flex items-center justify-center gap-2 rounded hover:-translate-y-0.5 transition ${variantClasses}`}
              aria-label={t(link.label)}
            >
              <Icon className="text-2xl" />
              <span className="hidden lg:flex flex-nowrap font-bold text-sm">
                {t(link.label)}
              </span>
            </Link>
          );
        })}

        {/* Notification badge */}
        {hasMounted && isAuthenticated && <GlobalNotificationBadgeTile />}

        {/* Profile avatar */}
        {hasMounted && isAuthenticated && (
          <div className="inline-flex items-center gap-2 rounded border border-bglight bg-white px-2 py-1 shadow-sm">
            <GlobalProfileAvatarTile />
          </div>
        )}

        {/* Menu toggle */}
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          ref={avatarRef}
          className="flex items-center gap-2 lg:hidden"
          aria-label={t('menu')}
        >
          {isMenuOpen ? (
            <PiXLight className="text-dark text-3xl" />
          ) : (
            <FiMenu className="text-dark text-3xl" />
          )}
        </button>
      </div>
    </>
  );
}
