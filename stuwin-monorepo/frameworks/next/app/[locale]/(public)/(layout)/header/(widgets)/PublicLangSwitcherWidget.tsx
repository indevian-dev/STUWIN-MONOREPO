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

const labelMap = {
  az: 'azerbaijani',
  ru: 'russian',
  en: 'english'
};

export function PublicLangSwitcherWidget() {
  const pathname = usePathname();
  const currentLocale = useLocale();
  const locales = routing.locales;
  const t = useTranslations('GlobalLangSwitcherTile');
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        className="inline-flex items-center gap-2 rounded px-3 py-1.5 text-sm font-semibold text-slate-800 hover:-translate-y-0.5 transition"
        onClick={() => setOpen(!open)}
        aria-label={t('select_language')}
      >
        <PiGlobeLight className="text-3xl" />
        <span className="uppercase text-lg">{currentLocale}</span>
      </button>
      <div
        className={`absolute right-0 mt-2 min-w-[160px] rounded-2xl border border-slate-200 bg-white shadow-lg ${open ? 'block' : 'hidden'}`}
      >
        <ul className="py-1">
          {locales.map((loc: string) => (
            <li key={loc}>
              <Link
                href={pathname}
                locale={loc}
                onClick={() => setOpen(false)}
                className={`block px-4 py-2 text-sm ${currentLocale === loc ? 'font-semibold text-brandSoftNeutral' : 'text-slate-700 hover:text-slate-900'}`}
              >
                {t(labelMap[loc as keyof typeof labelMap] || loc)}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

