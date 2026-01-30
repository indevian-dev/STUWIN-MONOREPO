import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePathname, Link } from '@/i18n/routing';
import { useLocale } from 'next-intl';
import { routing } from '@/i18n/routing';


export function LangSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const currentLocale = useLocale();
  const locales = routing.locales;
  const [showDropdown, setShowDropdown] = useState(false);



  return (
    <div className="relative">
      <button
        className="px-4 ml-4 py-2 text-dark rounded text-lg font-light transform transition-transform focus:outline-none"
        onMouseEnter={() => setShowDropdown(true)}
        onMouseLeave={() => setShowDropdown(false)}
      >
        {currentLocale}
      </button>
      <ul
        className={`absolute z-10 top-8 right-0 w-full py-2 flex flex-wrap justify-center px-2 mt-2 bg-gray-100 bg-opacity-100 rounded-primary text-md ${showDropdown ? 'block' : 'hidden'}`}
        onMouseEnter={() => setShowDropdown(true)}
        onMouseLeave={() => setShowDropdown(false)}
      >
        {locales && locales.map((loc: string) => (
          <li key={loc}>
            <Link href={pathname}
              className={`block px-3 py-2 hover:text-maincolordark ${currentLocale === loc
                ? 'scale-125 origin-center text-maincolordark font-bold'
                : ''
                }`}
              locale={loc}>
              {loc}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}