'use client'

import { useState } from 'react';
import { Link, usePathname } from '@/i18n/routing';
import { useLocale } from 'next-intl';
import { routing } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { PiGlobeLight, PiCheckBold, PiCaretDownBold } from 'react-icons/pi';

const fullNames: Record<string, string> = {
  az: 'Azərbaycan',
  ru: 'Русский',
  en: 'English'
};

export function GlobalLangSwitcherTile() {
  const pathname = usePathname();
  const currentLocale = useLocale();
  const locales = routing.locales;
  const t = useTranslations('GlobalLangSwitcherTile');
  const [open, setOpen] = useState(false);

  return (
    <div className="relative w-full">
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-label={t('select_language')}
        className="w-full flex items-center justify-between gap-3 rounded-app px-4 py-3 text-sm font-bold
          bg-black/5 dark:bg-white/8 border border-black/8 dark:border-white/10
          text-app-dark-blue dark:text-white
          hover:bg-app-bright-green/10 dark:hover:bg-app-bright-green/10
          hover:border-app-bright-green/30 dark:hover:border-app-bright-green/30
          transition-all duration-200"
      >
        <div className="flex items-center gap-3">
          <PiGlobeLight className="text-xl text-app-bright-green shrink-0" />
          <span>{fullNames[currentLocale] || currentLocale}</span>
        </div>
        <PiCaretDownBold
          className={`text-app-dark-blue/40 dark:text-white/40 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          size={14}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="mt-2 w-full rounded-app overflow-hidden
          border border-black/8 dark:border-white/10
          bg-white dark:bg-app-dark-blue/95
          shadow-app-widget backdrop-blur-md
          animate-in fade-in slide-in-from-top-2 duration-200">
          <ul className="py-1">
            {locales.map((loc: string) => (
              <li key={loc}>
                <Link
                  href={pathname}
                  locale={loc}
                  onClick={() => {
                    localStorage.setItem('locale', loc);
                    setOpen(false);
                  }}
                  className={`flex items-center justify-between px-4 py-3 text-sm font-bold transition-colors ${currentLocale === loc
                    ? 'bg-app-bright-green/10 text-app-bright-green'
                    : 'text-app-dark-blue/70 dark:text-white/70 hover:bg-black/5 dark:hover:bg-white/5 hover:text-app-dark-blue dark:hover:text-white'
                    }`}
                >
                  <span>{fullNames[loc] || loc}</span>
                  {currentLocale === loc && (
                    <PiCheckBold className="text-app-bright-green" size={14} />
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
