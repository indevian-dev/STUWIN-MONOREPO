'use client'

import { useState } from 'react';
import {
  Link,
  usePathname
} from '@/i18n/routing';
import { useLocale } from 'next-intl';
import { routing } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { PiGlobeLight } from 'react-icons/pi';

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
      <button
        type="button"
        className="w-full flex items-center justify-between gap-3 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 bg-slate-50 border border-slate-100 hover:bg-white hover:shadow-sm transition-all"
        onClick={() => setOpen(!open)}
        aria-label={t('select_language')}
      >
        <div className="flex items-center gap-3">
          <PiGlobeLight className="text-2xl text-brand" />
          <span className="font-black">{fullNames[currentLocale] || currentLocale}</span>
        </div>
        <div className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {open && (
        <div className="mt-2 w-full rounded-2xl border border-slate-100 bg-white shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
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
                    ? 'bg-brand/5 text-brand'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                >
                  <span>{fullNames[loc] || loc}</span>
                  {currentLocale === loc && (
                    <div className="w-2 h-2 rounded-full bg-brand" />
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

