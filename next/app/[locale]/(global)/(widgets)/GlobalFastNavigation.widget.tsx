
'use client';

import { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTranslations } from 'next-intl';
import { DomainNavConfig } from '@stuwin/shared/types/ui/Navigation.types'
import { GlobalProfileAvatarTile } from '@/app/[locale]/(global)/(tiles)/GlobalProfileAvatar.tile';
import { GlobalNotificationBadgeTile } from '@/app/[locale]/(global)/(tiles)/GlobalNotificationBadge.tile';
import { useGlobalAuthProfileContext } from '@/app/[locale]/(global)/(context)/GlobalAuthProfileContext';
import { FiMenu } from 'react-icons/fi';
import { PiXLight } from 'react-icons/pi';
import { Button } from '@/app/primitives/Button.primitive';

interface GlobalFastNavigationWidgetProps {
  config: DomainNavConfig;
  isMenuOpen: boolean;
  setIsMenuOpen: (isOpen: boolean) => void;
}

/**
 * Global Fast Navigation Widget
 *
 * Mobile: 5-col CSS Grid via portal (items with labels → col-span-2, icon-only → col-span-1)
 * Desktop: Flex inline inside the header
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
  const showLabels = fastNavLinks.length <= 2;

  const [hasMounted, setHasMounted] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => { setHasMounted(true); }, 0);
    return () => clearTimeout(timer);
  }, []);

  const isPublic = domain === 'public';
  const isAuthenticated = !!userId;

  // ─── Shared renderers ───

  const renderNavLinks = (mode: 'mobile' | 'desktop') => (
    fastNavLinks.map((link: any, index: number) => {
      const Icon = link.icon;
      const hasLabel = showLabels;
      const isMobile = mode === 'mobile';

      return (
        <Button
          key={index}
          isLink
          href={link.href}
          variant={link.variant === 'primary' ? 'default' : 'secondary'}
          className={`gap-1 ${isPublic ? 'rounded-app-full' : 'rounded-app'} ${isMobile ? `justify-center ${hasLabel ? 'col-span-2' : 'col-span-1'}` : ''}`}
          aria-label={t(link.label)}
        >
          <Icon className={isMobile ? 'text-xl' : 'text-2xl'} />
          {(isMobile ? hasLabel : true) && (
            <span className={`font-bold text-sm text-nowrap ${!isMobile && !showLabels ? 'hidden lg:flex' : 'flex'}`}>
              {t(link.label)}
            </span>
          )}
        </Button>
      );
    })
  );

  const renderMenuToggle = (mode: 'mobile' | 'desktop') => {
    const isMobile = mode === 'mobile';
    return (
      <Button
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        ref={!isPublic ? avatarRef as any : undefined}
        variant="secondary"
        className={`rounded-app-full ${isMobile
          ? 'col-span-1 justify-center'
          : isPublic ? 'gap-2 group' : 'flex lg:hidden px-2 py-1'
          }`}
        aria-label={t('menu')}
      >
        {isMenuOpen ? (
          <PiXLight className={`${isMobile ? 'text-xl' : 'text-2xl'} ${isPublic && !isMobile ? 'group-hover:text-app-bright-green' : ''}`} />
        ) : (
          <FiMenu className={`${isMobile ? 'text-xl' : 'text-2xl'} ${isPublic && !isMobile ? 'group-hover:text-app-bright-green' : ''}`} />
        )}
      </Button>
    );
  };

  // ─── Desktop bar (inline in header) ───

  const desktopBar = (
    <div className="hidden md:flex items-center gap-4">
      {renderNavLinks('desktop')}
      {!isPublic && hasMounted && isAuthenticated && <GlobalNotificationBadgeTile />}
      {!isPublic && hasMounted && isAuthenticated && (
        <div className="inline-flex items-center gap-2 rounded-app-full bg-white dark:bg-black/20 shadow-sm">
          <GlobalProfileAvatarTile />
        </div>
      )}
      {renderMenuToggle('desktop')}
    </div>
  );

  // ─── Mobile bar (portaled to body, grid) ───

  const mobileBar = hasMounted && createPortal(
    <div className="fixed bottom-0 left-0 right-0 z-30 md:hidden">
      <div className="w-full h-full bg-white/50 dark:bg-app-dark-blue/50 backdrop-blur-md border-t border-black/10 dark:border-white/10 inset-0 absolute -z-1" />
      <div className="grid grid-cols-5 items-center gap-1 py-2 px-4">
        {renderNavLinks('mobile')}
        {!isPublic && hasMounted && isAuthenticated && (
          <div className="col-span-1 flex justify-center"><GlobalNotificationBadgeTile /></div>
        )}
        {!isPublic && hasMounted && isAuthenticated && (
          <div className="col-span-1 flex justify-center"><GlobalProfileAvatarTile /></div>
        )}
        {renderMenuToggle('mobile')}
      </div>
    </div>,
    document.body
  );

  return (
    <>
      {desktopBar}
      {mobileBar}
    </>
  );
}
